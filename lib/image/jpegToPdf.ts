import { PDFDocument } from "pdf-lib";

export async function convertJpegToPdf(file: File): Promise<Uint8Array> {
  if (!file.type.includes("jpeg")) {
    throw new Error("File must be JPEG");
  }

  const pdfDoc = await PDFDocument.create();
  const bytes = await file.arrayBuffer();

  const image = await pdfDoc.embedJpg(bytes);

  const page = pdfDoc.addPage([image.width, image.height]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return await pdfDoc.save();
}
