export const IMAGE_MAX_EDGE = 1280;
export const IMAGE_JPEG_QUALITY = 0.8;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("read error"));
    reader.onabort = () => reject(new Error("read aborted"));
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("decode error"));
    img.src = url;
  });
}

/**
 * Thu nhỏ ảnh (cạnh dài tối đa 1280px) và nén JPEG ~0.8 thành data URL, để 6 ảnh/tin
 * vẫn vừa quota localStorage (~5MB). Nếu trình duyệt không nén được, dùng file gốc.
 */
export async function compressImage(
  file: File,
  maxEdge = IMAGE_MAX_EDGE,
  quality = IMAGE_JPEG_QUALITY,
): Promise<string> {
  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const img = await loadImage(objectUrl);
    const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no canvas");
    ctx.fillStyle = "#ffffff"; // JPEG không có kênh alpha
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", quality);
    if (!dataUrl.startsWith("data:image/")) throw new Error("encode error");
    return dataUrl;
  } catch {
    return readAsDataUrl(file);
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}
