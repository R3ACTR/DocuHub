import { NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export async function POST(req: Request) {
  try {
    const { files, targetBytes } = await req.json();

    if (!files || !files.length) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const results = [];

    for (const file of files) {
      const cleanBase64 = file.base64.includes(",")
        ? file.base64.split(",")[1]
        : file.base64;

      const bytes = Uint8Array.from(
        atob(cleanBase64),
        c => c.charCodeAt(0)
      );

      const originalSizeMB = (bytes.length / (1024 * 1024)).toFixed(2);

      const pdfDoc = await PDFDocument.load(bytes);

      const compressedBytes = await pdfDoc.save({
        useObjectStreams: true,
      });

      const compressedSizeMB = (
        compressedBytes.length /
        (1024 * 1024)
      ).toFixed(2);

      const reduction = (
        100 -
        (Number(compressedSizeMB) / Number(originalSizeMB)) * 100
      ).toFixed(0);

      results.push({
        original: originalSizeMB,
        compressed: compressedSizeMB,
        reduction,
        file: Buffer.from(compressedBytes).toString("base64"),
      });
    }

    return NextResponse.json({ results });

  } catch (err) {
    return NextResponse.json(
      { error: "Compression failed" },
      { status: 500 }
    );
  }
}
