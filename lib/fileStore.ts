import { buildThreatWarning, scanUploadedFiles } from "@/lib/security/virusScan";

let storedFiles: {
  data: string;
  name: string;
  type: string;
  file?: File;
  password?: string;
}[] = [];

export async function storeFiles(
  files: File[],
  options?: { password?: string }
): Promise<boolean> {
  try {
    // ✅ MAX FILE COUNT LIMIT
    const MAX_FILES = 10;

    if (files.length > MAX_FILES) {
      alert(`You can upload a maximum of ${MAX_FILES} files.`);
      return false;
    }

    const { cleanFiles, threats } = await scanUploadedFiles(files);
    if (!cleanFiles.length) {
      alert(buildThreatWarning(threats));
      return false;
    }

    if (threats.length) {
      alert(buildThreatWarning(threats));
    }

    const results = await Promise.all(
      cleanFiles.map(
        (file) =>
          new Promise<{
            data: string;
            name: string;
            type: string;
            file?: File;
            password?: string;
          }>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () =>
              resolve({
                data: reader.result as string,
                name: file.name,
                type: file.type,
                file,
                password: options?.password,
              });

            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );

    storedFiles = results;
    return true;
  } catch {
    return false;
  }
}

export function getStoredFiles() {
  return storedFiles;
}

export function clearStoredFiles() {
  storedFiles = [];
}
