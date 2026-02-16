let storedFiles: {
  data: string;
  name: string;
  type: string;
  password?: string;
}[] = [];

export async function storeFiles(
  files: File[],
  options?: { password?: string }
): Promise<boolean> {
  try {
    const results = await Promise.all(
      files.map(
        (file) =>
          new Promise<{
            data: string;
            name: string;
            type: string;
            password?: string;
          }>((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () =>
              resolve({
                data: reader.result as string,
                name: file.name,
                type: file.type,
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
