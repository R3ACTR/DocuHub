import { encryptPDF } from "@pdfsmaller/pdf-encrypt-lite";

export async function protectPdfBytes(bytes: Uint8Array, password: string) {
  const normalizedPassword = password.trim();
  if (!normalizedPassword) {
    throw new Error("Password is required to protect PDF.");
  }

  return encryptPDF(bytes, normalizedPassword, normalizedPassword);
}
