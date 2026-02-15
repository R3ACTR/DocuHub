let storedFiles: {
  data: string;
  name: string;
  type: string;
  password?: string;
}[] = [];

export async function storeFile(
  file: File,
  options?: { password?: string }
): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => {
      storedFiles.push({
        data: reader.result as string,
        name: file.name,
        type: file.type,
        password: options?.password,
      });

      resolve(true);
    };

    reader.onerror = () => resolve(false);

    reader.readAsDataURL(file);
  });
}

export function getStoredFiles() {
  return storedFiles;
}

export function clearStoredFiles() {
  storedFiles = [];
}
