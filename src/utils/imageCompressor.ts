/**
 * Utility to compress images on the client side using a HTML5 Canvas.
 * Maintains aspect ratio while scaling down high-resolution images
 * to a target width/height (e.g. max 1200px) and outputs a compressed JPEG/WebP.
 */
export async function compressImage(file: File, maxDimension = 1200, quality = 0.8): Promise<File> {
  // If the file is not an image or is very small, return it directly.
  if (!file.type.startsWith("image/") || file.size < 200 * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        // Draw image onto canvas (this performs downscaling)
        ctx.drawImage(img, 0, 0, width, height);

        // Determine target output type (prefer WebP if original was WebP, otherwise JPEG is safest/most supported)
        const outputType = file.type === "image/webp" ? "image/webp" : "image/jpeg";

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            // Construct a new file with the compressed blob
            const newFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          outputType,
          quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
