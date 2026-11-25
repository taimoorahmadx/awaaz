// Client-side image compression before preview, upload, or localStorage persistence.
// Keeps payloads and localStorage usage small (longest side ≤ 800px, JPEG quality 0.7).

export interface CompressedImage {
  dataUrl: string;
  mimeType: "image/jpeg";
  base64: string;
}

const MAX_LONGEST_SIDE_PX = 800;
const JPEG_QUALITY = 0.7;

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image file."));
    };
    img.src = objectUrl;
  });
}

/**
 * Compresses an image File/Blob via HTMLCanvasElement to JPEG (longest side ≤ 800px, quality 0.7).
 */
export async function compressImage(file: Blob): Promise<CompressedImage> {
  const img = await loadImage(file);
  const srcWidth = img.naturalWidth || img.width;
  const srcHeight = img.naturalHeight || img.height;
  if (!srcWidth || !srcHeight) {
    throw new Error("Image has invalid dimensions.");
  }

  const longest = Math.max(srcWidth, srcHeight);
  const scale = longest > MAX_LONGEST_SIDE_PX ? MAX_LONGEST_SIDE_PX / longest : 1;
  const width = Math.max(1, Math.round(srcWidth * scale));
  const height = Math.max(1, Math.round(srcHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  // JPEG has no alpha channel; fill white so transparent PNG/WebP images don't get black backgrounds.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  const commaIdx = dataUrl.indexOf(",");
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;

  return { dataUrl, mimeType: "image/jpeg", base64 };
}

/** Converts a raw base64 string into a Blob for multipart/form-data submission. */
export function base64ToBlob(base64: string, mimeType = "image/jpeg"): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

