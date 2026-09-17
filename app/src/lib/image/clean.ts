// Turns a phone photo of a garment into a catalogue-style tile, entirely in
// the browser: remove the background, crop to the garment, centre it on a
// white square, export as JPEG. Nothing is sent to a server.
//
// The neural network runs through @imgly/background-removal (AGPL-3.0) on
// onnxruntime-web. Its ~40 MB quantised model is fetched from the IMG.LY CDN
// on first use and cached by the browser afterwards.

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
// Work at most at this size so the pixel passes stay fast on phones
const WORK_SIDE = 2000;
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.9;

export async function cleanGarmentPhoto(
  file: File,
  onProgress: (progress: CleanProgress) => void,
): Promise<File> {
  if (file.type === "image/heic" || file.type === "image/heif") {
    throw new UnsupportedImageError("This browser cannot decode HEIC photos");
  }

  const { removeBackground } = await import("@imgly/background-removal");

  let downloading = true;
  const cutout = await removeBackground(file, {
    model: "isnet_quint8",
    output: { format: "image/png" },
    progress: (_key, loaded, total) => {
      if (!downloading) return;
      onProgress({ phase: "download", loaded, total });
      if (loaded >= total) {
        downloading = false;
        onProgress({ phase: "process" });
      }
    },
  });
  onProgress({ phase: "process" });

  const bitmap = await createImageBitmap(cutout);
  try {
    return await compositeOnWhite(bitmap, file.name);
  } finally {
    bitmap.close();
  }
}

// Cleans up the cutout's matte, finds the garment, pads it, and draws it
// centred on a white square no larger than MAX_SIDE.
async function compositeOnWhite(bitmap: ImageBitmap, sourceName: string): Promise<File> {
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
    const a = data[i * 4 + 3];
    let hardened: number;
    if (a <= ALPHA_LOW) hardened = 0;
    else if (a >= ALPHA_HIGH) hardened = 255;
    else {
      const t = (a - ALPHA_LOW) / (ALPHA_HIGH - ALPHA_LOW);
      hardened = Math.round(255 * t * t * (3 - 2 * t));
    }
    data[i * 4 + 3] = hardened;
    solid[i] = hardened >= SOLID ? 1 : 0;
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
  }
  sctx.putImageData(imageData, 0, 0);

  const boxW = maxX - minX + 1;
  const boxH = maxY - minY + 1;
  const longest = Math.max(boxW, boxH);
  const padding = Math.round(longest * PADDING_RATIO);
  const squareSource = longest + padding * 2;
  const scale = Math.min(1, MAX_SIDE / squareSource);
  const side = Math.round(squareSource * scale);

  const out = makeCanvas(side, side);
  const octx = out.getContext("2d");
  if (!octx) throw new Error("Canvas is not available");
  octx.fillStyle = "#FFFFFF";
  octx.fillRect(0, 0, side, side);

  const drawW = Math.round(boxW * scale);
  const drawH = Math.round(boxH * scale);
  const dx = Math.round((side - drawW) / 2);
  const dy = Math.round((side - drawH) / 2);
  octx.imageSmoothingQuality = "high";
  octx.drawImage(scratch, minX, minY, boxW, boxH, dx, dy, drawW, drawH);

  const blob = await toBlob(out, "image/jpeg", JPEG_QUALITY);
  const base = sourceName.replace(/\.[^.]+$/, "") || "item";
  return new File([blob], `${base}-clean.jpg`, { type: "image/jpeg" });
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))),
      type,
      quality,
    );
  });
}
