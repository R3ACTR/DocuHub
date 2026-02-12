// lib/fileStore.ts
// Shared file storage module for passing files between pages

export interface StoredFile {
  data: string;
  name: string;
  type: string;
}

// In-memory fallback for large files that can't fit in sessionStorage
let inMemoryFile: StoredFile | null = null;

const STORAGE_KEYS = {
  file: "ocrFile",
  name: "ocrFileName",
  type: "ocrFileType",
} as const;

export function getStoredFile(): StoredFile | null {
  // Try sessionStorage first
  if (typeof window === "undefined") return null;
  
  const sessionData = sessionStorage.getItem(STORAGE_KEYS.file);
  if (sessionData) {
    return {
      data: sessionData,
      name: sessionStorage.getItem(STORAGE_KEYS.name) || "file",
      type: sessionStorage.getItem(STORAGE_KEYS.type) || "image/png",
    };
  }
  // Fall back to in-memory
  return inMemoryFile;
}

export function clearStoredFile(): void {
  if (typeof window === "undefined") return;
  
  sessionStorage.removeItem(STORAGE_KEYS.file);
  sessionStorage.removeItem(STORAGE_KEYS.name);
  sessionStorage.removeItem(STORAGE_KEYS.type);
  inMemoryFile = null;
}

// Compress image using canvas
async function compressImage(
  file: File,
  maxSizeMB: number = 4
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        // Calculate target dimensions while maintaining aspect ratio
        const maxDimension = 2048;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        const maxBytes = maxSizeMB * 1024 * 1024;
        while (dataUrl.length > maxBytes && quality > 0.1) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }

        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

// Store file with compression fallback
export async function storeFile(file: File): Promise<boolean> {
  const maxSessionStorageSize = 4 * 1024 * 1024; // 4MB to be safe

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;

      // If small enough, store directly
      if (dataUrl.length < maxSessionStorageSize) {
        try {
          sessionStorage.setItem(STORAGE_KEYS.file, dataUrl);
          sessionStorage.setItem(STORAGE_KEYS.name, file.name);
          sessionStorage.setItem(STORAGE_KEYS.type, file.type);
          resolve(true);
          return;
        } catch {
          // Continue to compression
        }
      }

      // Try compressing if it's an image
      if (file.type.startsWith("image/")) {
        try {
          const compressedDataUrl = await compressImage(file);

          if (compressedDataUrl.length < maxSessionStorageSize) {
            sessionStorage.setItem(STORAGE_KEYS.file, compressedDataUrl);
            sessionStorage.setItem(STORAGE_KEYS.name, file.name);
            sessionStorage.setItem(STORAGE_KEYS.type, "image/jpeg");
            resolve(true);
            return;
          }
        } catch (err) {
          console.warn("Compression failed:", err);
        }
      }

      // Fall back to in-memory storage
      inMemoryFile = {
        data: dataUrl,
        name: file.name,
        type: file.type,
      };
      resolve(true);
    };
    reader.onerror = () => resolve(false);
    reader.readAsDataURL(file);
  });
}