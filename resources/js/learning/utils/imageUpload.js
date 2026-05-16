/**
 * Resize-then-base64 helper for admin image uploads.
 *
 * Why: PHP/nginx multipart upload limits are a rabbit hole
 * (post_max_size, upload_max_filesize, client_max_body_size, mod_security).
 * The simplest cure is to never hand the server a 3 MB file in the first
 * place. We resize the image in the browser to a child-friendly size
 * (max 800×800 by default), re-encode at quality 0.85, and POST the
 * result as JSON base64 — typically 80–200 KB, well under any limit.
 *
 * Returns a data URL ("data:image/jpeg;base64,...") suitable for posting
 * to /admin/words/{id}/image and /admin/units/{id}/image as `image_base64`.
 */

export const MAX_INPUT_BYTES = 20 * 1024 * 1024; // 20 MB raw input cap

const SUPPORTED_MIMES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/bmp",
    "image/svg+xml",
];

export function isSupportedImage(file) {
    return file && SUPPORTED_MIMES.includes(file.type);
}

/**
 * Read a File into an HTMLImageElement so we can draw it onto a canvas.
 */
function fileToImage(file) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            URL.revokeObjectURL(url);
            resolve(img);
        };
        img.onerror = (e) => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not decode image"));
        };
        img.src = url;
    });
}

/**
 * Resize and re-encode an image File. Returns a data URL.
 *
 * Options:
 *   maxSize  - longest-edge cap in pixels (default 800)
 *   quality  - 0..1 JPEG/WebP quality (default 0.85)
 *   format   - 'jpeg' | 'png' | 'webp' (default 'jpeg' — best size for photos)
 *
 * SVGs are passed through unchanged (resizing them on a canvas
 * rasterises them, which is almost always wrong).
 */
export async function shrinkImage(file, {
    maxSize = 800,
    quality = 0.85,
    format = "jpeg",
} = {}) {
    if (!file) throw new Error("No file provided");
    if (file.size > MAX_INPUT_BYTES) {
        throw new Error(`File is larger than ${(MAX_INPUT_BYTES / 1024 / 1024).toFixed(0)} MB`);
    }
    if (!isSupportedImage(file)) {
        throw new Error("Unsupported image type. Use JPG, PNG, WebP, GIF, BMP or SVG.");
    }

    // SVG: read text directly, no resize. The server will store it as-is.
    if (file.type === "image/svg+xml") {
        const text = await file.text();
        return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(text)));
    }

    const img = await fileToImage(file);
    const w = img.naturalWidth || img.width || 1;
    const h = img.naturalHeight || img.height || 1;

    const scale = Math.min(1, maxSize / Math.max(w, h));
    const targetW = Math.max(1, Math.round(w * scale));
    const targetH = Math.max(1, Math.round(h * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Browser cannot create a 2D canvas context");

    // White backdrop so transparent PNGs don't go black when we encode JPEG
    if (format === "jpeg") {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, targetW, targetH);
    }
    ctx.drawImage(img, 0, 0, targetW, targetH);

    const mime =
        format === "png"
            ? "image/png"
            : format === "webp"
                ? "image/webp"
                : "image/jpeg";
    const dataUrl = canvas.toDataURL(mime, quality);

    if (!dataUrl || !dataUrl.startsWith("data:")) {
        throw new Error("Image encoding failed");
    }
    return dataUrl;
}

/**
 * Convenience wrapper used by the admin: try to shrink to ≤200 KB.
 * Falls back to a smaller-still version if the first try is too big
 * (which can happen with very wide images).
 */
export async function shrinkForAdminUpload(file) {
    let dataUrl = await shrinkImage(file, { maxSize: 800, quality: 0.85 });
    // Rough size estimate: base64 ≈ 4/3 of bytes, so 200 KB raw ≈ 270 KB string
    if (dataUrl.length > 270 * 1024) {
        dataUrl = await shrinkImage(file, { maxSize: 600, quality: 0.78 });
    }
    if (dataUrl.length > 270 * 1024) {
        dataUrl = await shrinkImage(file, { maxSize: 480, quality: 0.7 });
    }
    return dataUrl;
}
