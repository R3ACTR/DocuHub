import { PDFDocument } from "pdf-lib";

export async function jpgToPdf(file: File): Promise<Uint8Array> {
  if (!file.type.includes("jpeg") && !file.type.includes("jpg")) {
    throw new Error("Only JPG images are supported.");
  }

  const bytes = await file.arrayBuffer();

  const pdf = await PDFDocument.create();
  const image = await pdf.embedJpg(bytes);

  const page = pdf.addPage([image.width, image.height]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return await pdf.save();
}
