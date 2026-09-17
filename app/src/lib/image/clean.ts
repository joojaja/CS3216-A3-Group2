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

const ALPHA_THRESHOLD = 16;
const MIN_COVERAGE = 0.02;
const PADDING_RATIO = 0.08;
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

// Finds the opaque region of the cutout, pads it, and draws it centred on a
// white square no larger than MAX_SIDE.
async function compositeOnWhite(bitmap: ImageBitmap, sourceName: string): Promise<File> {
  const { width, height } = bitmap;
  const scratch = makeCanvas(width, height);
  const sctx = scratch.getContext("2d");
  if (!sctx) throw new Error("Canvas is not available");
  sctx.drawImage(bitmap, 0, 0);

  const { data } = sctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let opaque = 0;

  for (let y = 0; y < height; y++) {
    const row = y * width * 4;
    for (let x = 0; x < width; x++) {
      if (data[row + x * 4 + 3] > ALPHA_THRESHOLD) {
        opaque++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0 || opaque / (width * height) < MIN_COVERAGE) {
    throw new NothingDetectedError("Could not find a garment in the photo");
  }

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
