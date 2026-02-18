let storedFiles: {
  data: string;
  name: string;
  type: string;
  file?: File;
  password?: string;
  encryptOutput?: boolean;
  outputPassword?: string;
}[] = [];

export type StoreFilesResult = {
  ok: boolean;
  error?: string;
};

export async function storeFiles(
  files: File[],
  options?: { password?: string; encryptOutput?: boolean; outputPassword?: string }
): Promise<StoreFilesResult> {
  try {
    const MAX_FILES = 10;

    if (files.length > MAX_FILES) {
      return {
        ok: false,
        error: `You can upload up to ${MAX_FILES} files.`,
      };
    }

    const results = await Promise.all(
      files.map(
        (file) =>
          new Promise<{
            data: string;
            name: string;
            type: string;
            file?: File;
            password?: string;
            encryptOutput?: boolean;
            outputPassword?: string;
          }>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () =>
              resolve({
                data: reader.result as string,
                name: file.name,
                type: file.type,
                file,
                password: options?.password,
                encryptOutput: options?.encryptOutput,
                outputPassword: options?.outputPassword,
              });

            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      )
    );

    storedFiles = results;
    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Failed to prepare files for processing.",
    };
  }
}

export function getStoredFiles() {
  return storedFiles;
}

export function clearStoredFiles() {
  storedFiles = [];
}
