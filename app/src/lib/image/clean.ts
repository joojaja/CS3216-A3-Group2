// Turns a phone photo of a garment into a catalogue-style tile, entirely in
// the browser: remove the background, crop to the garment, centre it on a
// white square, export as JPEG. Nothing is sent to a server.
//
// The neural network runs through @imgly/background-removal (AGPL-3.0) on
// onnxruntime-web. Its ~40 MB quantised model is fetched from the IMG.LY CDN
// on first use and cached by the browser afterwards.

import { fitWithin, hardenAlpha } from "@/lib/image/matte";

export type CleanProgress =
  | { phase: "download"; loaded: number; total: number }
  | { phase: "process" };

// The browser cannot decode this file type, so removal is impossible here
export class UnsupportedImageError extends Error {}

// The model returned an empty or near-empty cutout
export class NothingDetectedError extends Error {}

// Alpha below LOW becomes fully transparent, above HIGH fully opaque, with a
// smooth ramp between. This removes the faint haze the model leaves over
// low-contrast backgrounds while keeping soft garment edges
const ALPHA_LOW = 90;
const ALPHA_HIGH = 190;
const SOLID = 128;
// Disconnected blobs smaller than this share of the largest one are specks
// or misread background, not garment. Both shoes of a pair survive, stray
// fibres and small patches of bedsheet do not
const MIN_COMPONENT_RATIO = 0.2;
const MIN_COMPONENT_PIXELS = 64;
const MIN_COVERAGE = 0.02;
const PADDING_RATIO = 0.08;
// There is no benefit in cleaning above the largest exported size. Keeping
// these equal also avoids allocating several oversized pixel buffers on phones.
const WORK_SIDE = 1600;
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.9;
// Outfit cards draw cut-outs a few hundred pixels tall at most
const CUTOUT_SIDE = 800;
const CUTOUT_PADDING_RATIO = 0.02;
const PIXELS_PER_YIELD = 100_000;

type PendingRemoval = {
  resolve: (result: Blob) => void;
  reject: (error: Error) => void;
  onProgress: (loaded: number, total: number) => void;
  signal?: AbortSignal;
  abort?: () => void;
};

let removalWorker: Worker | null = null;
let nextRemovalId = 0;
const pendingRemovals = new Map<number, PendingRemoval>();

function getRemovalWorker() {
  if (removalWorker) return removalWorker;

  const worker = new Worker("/vendor/background-removal/worker.js", { type: "module" });

  worker.addEventListener(
    "message",
    (event: MessageEvent<
      | { type: "progress"; id: number; loaded: number; total: number }
      | { type: "done"; id: number; result: Blob }
      | { type: "error"; id: number; message: string }
    >) => {
      const job = pendingRemovals.get(event.data.id);
      if (!job) return;

      if (event.data.type === "progress") {
        job.onProgress(event.data.loaded, event.data.total);
        return;
      }

      pendingRemovals.delete(event.data.id);
      if (job.signal && job.abort) job.signal.removeEventListener("abort", job.abort);

      if (event.data.type === "done") job.resolve(event.data.result);
      else job.reject(new Error(event.data.message));
    },
  );

  worker.addEventListener("error", () => {
    const error = new Error("The background-removal worker could not start");
    for (const job of pendingRemovals.values()) {
      if (job.signal && job.abort) job.signal.removeEventListener("abort", job.abort);
      job.reject(error);
    }
    pendingRemovals.clear();
    worker.terminate();
    if (removalWorker === worker) removalWorker = null;
  });

  removalWorker = worker;
  return worker;
}

function removeBackgroundOffThread(
  file: File,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
) {
  return new Promise<Blob>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Background removal was cancelled", "AbortError"));
      return;
    }

    const id = ++nextRemovalId;
    const worker = getRemovalWorker();
    const job: PendingRemoval = { resolve, reject, onProgress, signal };
    const abort = () => {
      pendingRemovals.delete(id);
      worker.postMessage({ type: "cancel", id });
      reject(new DOMException("Background removal was cancelled", "AbortError"));
    };
    job.abort = abort;
    pendingRemovals.set(id, job);
    signal?.addEventListener("abort", abort, { once: true });
    worker.postMessage({ type: "start", id, file });
  });
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Background removal was cancelled", "AbortError");
}

function yieldToBrowser() {
  return new Promise<void>((resolve) => setTimeout(resolve, 0));
}

// The white catalogue tile the wardrobe shows, and a transparent PNG of the
// garment alone that outfit cards draw straight onto their background
export type CleanResult = { tile: File; cutout: File };

export async function cleanGarmentPhoto(
  file: File,
  onProgress: (progress: CleanProgress) => void,
  signal?: AbortSignal,
): Promise<CleanResult> {
  if (file.type === "image/heic" || file.type === "image/heif") {
    throw new UnsupportedImageError("This browser cannot decode HEIC photos");
  }

  let downloading = true;
  const cutout = await removeBackgroundOffThread(
    file,
    (loaded, total) => {
      if (!downloading) return;
      onProgress({ phase: "download", loaded, total });
      if (loaded >= total) {
        downloading = false;
        onProgress({ phase: "process" });
      }
    },
    signal,
  );
  throwIfAborted(signal);
  onProgress({ phase: "process" });

  const bitmap = await createImageBitmap(cutout);
  try {
    const matte = await cleanMatte(bitmap, signal);
    const { canvas, x, y, width, height } = matte;
    return {
      tile: await tileOnWhite(canvas, x, y, width, height, file.name, "clean"),
      cutout: await cutoutPng(matte, file.name),
    };
  } finally {
    bitmap.close();
  }
}

// A transparent cut-out of any stored garment photo, for items saved before
// cut-outs existed. Same model, same matte clean-up, nothing leaves the device
export async function cutoutFromImage(image: Blob, signal?: AbortSignal): Promise<File> {
  const file = image instanceof File ? image : new File([image], "item", { type: image.type });
  const removed = await removeBackgroundOffThread(file, () => undefined, signal);
  throwIfAborted(signal);
  const bitmap = await createImageBitmap(removed);
  try {
    return await cutoutPng(await cleanMatte(bitmap, signal), file.name);
  } finally {
    bitmap.close();
  }
}

type Matte = { canvas: HTMLCanvasElement; x: number; y: number; width: number; height: number };

// Trims the cleaned matte to the garment and encodes it as a transparent PNG
// no larger than CUTOUT_SIDE, with a little room so soft edges are not clipped
async function cutoutPng(matte: Matte, sourceName: string): Promise<File> {
  const pad = Math.round(Math.max(matte.width, matte.height) * CUTOUT_PADDING_RATIO);
  const sx = Math.max(0, matte.x - pad);
  const sy = Math.max(0, matte.y - pad);
  const sw = Math.min(matte.canvas.width - sx, matte.width + pad * 2);
  const sh = Math.min(matte.canvas.height - sy, matte.height + pad * 2);
  const { width, height } = fitWithin(sw, sh, CUTOUT_SIDE);

  const out = makeCanvas(width, height);
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas is not available");
  octx.imageSmoothingQuality = "high";
  octx.drawImage(matte.canvas, sx, sy, sw, sh, 0, 0, width, height);

  const blob = await toBlob(out, "image/png");
  const base = sourceName.replace(/\.[^.]+$/, "") || "item";
  return new File([blob], `${base}-cutout.png`, { type: "image/png" });
}

// Cleans up the cutout's matte and finds the garment's bounds on a canvas no
// larger than WORK_SIDE. Transparency is kept, so callers can either flatten
// it onto white or export it as a cut-out.
async function cleanMatte(bitmap: ImageBitmap, signal?: AbortSignal): Promise<Matte> {
  const workScale = Math.min(1, WORK_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * workScale));
  const height = Math.max(1, Math.round(bitmap.height * workScale));
  const scratch = makeCanvas(width, height);
  const sctx = scratch.getContext("2d");
  if (!sctx) throw new Error("Canvas is not available");
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(bitmap, 0, 0, width, height);

  const imageData = sctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  const total = width * height;

  // Pass 1: harden the matte
  const solid = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const hardened = hardenAlpha(data[i * 4 + 3], ALPHA_LOW, ALPHA_HIGH);
    data[i * 4 + 3] = hardened;
    solid[i] = hardened >= SOLID ? 1 : 0;
    if (i > 0 && i % PIXELS_PER_YIELD === 0) {
      await yieldToBrowser();
      throwIfAborted(signal);
    }
  }

  // Pass 2: label connected solid regions and keep the substantial ones
  const label = new Int32Array(total);
  const sizes: number[] = [0];
  const queue = new Int32Array(total);
  for (let start = 0; start < total; start++) {
    if (!solid[start] || label[start]) continue;
    const id = sizes.length;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    label[start] = id;
    let size = 0;
    while (head < tail) {
      const p = queue[head++];
      size++;
      const x = p % width;
      if (x > 0 && solid[p - 1] && !label[p - 1]) { label[p - 1] = id; queue[tail++] = p - 1; }
      if (x < width - 1 && solid[p + 1] && !label[p + 1]) { label[p + 1] = id; queue[tail++] = p + 1; }
      if (p >= width && solid[p - width] && !label[p - width]) { label[p - width] = id; queue[tail++] = p - width; }
      if (p + width < total && solid[p + width] && !label[p + width]) { label[p + width] = id; queue[tail++] = p + width; }
      if (head % PIXELS_PER_YIELD === 0) {
        await yieldToBrowser();
        throwIfAborted(signal);
      }
    }
    sizes.push(size);
  }

  const largest = Math.max(0, ...sizes);
  if (largest === 0 || largest / total < MIN_COVERAGE) {
    throw new NothingDetectedError("Could not find a garment in the photo");
  }
  const keepMin = Math.max(MIN_COMPONENT_PIXELS, largest * MIN_COMPONENT_RATIO);
  const keep = sizes.map((s) => s >= keepMin);

  // Pass 3: erase everything outside kept regions, apart from the one-pixel
  // soft edge that touches them, and find the bounds of what remains
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let i = 0; i < total; i++) {
    const a = data[i * 4 + 3];
    if (a === 0) continue;
    const x = i % width;
    let kept = keep[label[i]];
    if (!kept) {
      kept =
        (x > 0 && keep[label[i - 1]]) ||
        (x < width - 1 && keep[label[i + 1]]) ||
        (i >= width && keep[label[i - width]]) ||
        (i + width < total && keep[label[i + width]]);
    }
    if (!kept) {
      data[i * 4 + 3] = 0;
      continue;
    }
    const y = (i - x) / width;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (i > 0 && i % PIXELS_PER_YIELD === 0) {
      await yieldToBrowser();
      throwIfAborted(signal);
    }
  }
  sctx.putImageData(imageData, 0, 0);

  return { canvas: scratch, x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

// Normalised 0..1 box with the origin at the top left, as returned by the
// locate endpoint.
export type NormalizedBox = { ymin: number; xmin: number; ymax: number; xmax: number };

// Fallback when segmentation fails: crop the photo to the garment's box and
// present it as a tile, background and all. The garment is framed properly
// even though it could not be separated from what it lies on.
export async function cropGarmentPhoto(file: File, box: NormalizedBox): Promise<File> {
  if (file.type === "image/heic" || file.type === "image/heif") {
    throw new UnsupportedImageError("This browser cannot decode HEIC photos");
  }

  const bitmap = await createImageBitmap(file);
  try {
    const { width, height } = bitmap;
    const boxW = (box.xmax - box.xmin) * width;
    const boxH = (box.ymax - box.ymin) * height;
    if (boxW < width * 0.05 || boxH < height * 0.05) {
      throw new NothingDetectedError("The garment box was too small to use");
    }

    const padding = Math.max(boxW, boxH) * PADDING_RATIO;
    const x0 = Math.max(0, Math.round(box.xmin * width - padding));
    const y0 = Math.max(0, Math.round(box.ymin * height - padding));
    const x1 = Math.min(width, Math.round(box.xmax * width + padding));
    const y1 = Math.min(height, Math.round(box.ymax * height + padding));

    return await tileOnWhite(bitmap, x0, y0, x1 - x0, y1 - y0, file.name, "crop");
  } finally {
    bitmap.close();
  }
}

// Draws a region of the source centred on a white square no larger than
// MAX_SIDE and encodes it as JPEG. Shared by the cutout and crop paths so
// every wardrobe tile has the same framing.
async function tileOnWhite(
  source: CanvasImageSource,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  sourceName: string,
  suffix: string,
): Promise<File> {
  const longest = Math.max(sw, sh);
  const padding = Math.round(longest * PADDING_RATIO);
  const squareSource = longest + padding * 2;
  const scale = Math.min(1, MAX_SIDE / squareSource);
  const side = Math.round(squareSource * scale);

  const out = makeCanvas(side, side);
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas is not available");
  octx.fillStyle = "#FFFFFF";
  octx.fillRect(0, 0, side, side);

  const drawW = Math.round(sw * scale);
  const drawH = Math.round(sh * scale);
  const dx = Math.round((side - drawW) / 2);
  const dy = Math.round((side - drawH) / 2);
  octx.imageSmoothingQuality = "high";
  octx.drawImage(source, sx, sy, sw, sh, dx, dy, drawW, drawH);

  const blob = await toBlob(out, "image/jpeg", JPEG_QUALITY);
  const base = sourceName.replace(/\.[^.]+$/, "") || "item";
  return new File([blob], `${base}-${suffix}.jpg`, { type: "image/jpeg" });
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      type,
      quality,
    );
  });
}
