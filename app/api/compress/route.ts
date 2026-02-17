import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";

export const runtime = "nodejs";

type CompressionLevel = "low" | "medium" | "high";
type CompressionStatus = "no_target" | "target_reached" | "target_unreachable";

type Candidate = {
  bytes: Uint8Array;
  score: number;
};

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MIN_TARGET_BYTES = 8 * 1024;

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const level = parseCompressionLevel(form.get("compressionLevel"));
    const targetBytes = parseTargetBytes(form.get("targetBytes"));

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum file size is 10MB." },
        { status: 413 },
      );
    }

    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    await assertPdfReadable(sourceBytes);

    const candidates = await buildCandidates(sourceBytes, level);
    const selected = selectCandidate(sourceBytes, candidates, targetBytes);

    const compressedBytes = selected.bytes.length;
    const reductionRatio =
      sourceBytes.length > 0
        ? (sourceBytes.length - compressedBytes) / sourceBytes.length
        : 0;

    const status: CompressionStatus =
      targetBytes == null
        ? "no_target"
        : compressedBytes <= targetBytes
          ? "target_reached"
          : "target_unreachable";

    return NextResponse.json({
      status,
      targetBytes,
      originalBytes: sourceBytes.length,
      compressedBytes,
      reductionRatio,
      outputBase64: Buffer.from(selected.bytes).toString("base64"),
    });
  } catch (error) {
    console.error("Compression API failed:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Compression request failed.",
      },
      { status: 500 },
    );
  }
}

async function buildCandidates(
  sourceBytes: Uint8Array,
  level: CompressionLevel,
): Promise<Candidate[]> {
  const profiles = getProfilesForLevel(level);
  const unique = new Map<number, Candidate>();

  for (const profile of profiles) {
    try {
      const bytes = await structuralCompress(sourceBytes, {
        useObjectStreams: profile.useObjectStreams,
        objectsPerTick: profile.objectsPerTick,
      });
      const score = profile.score;
      const existing = unique.get(bytes.length);
      if (!existing || score > existing.score) {
        unique.set(bytes.length, { bytes, score });
      }
    } catch {
      // Ignore failed profiles and keep successful candidates.
    }
  }

  if (!unique.size) {
    throw new Error("Unable to compress this PDF.");
  }

  return Array.from(unique.values());
}

function selectCandidate(
  sourceBytes: Uint8Array,
  candidates: Candidate[],
  targetBytes: number | null,
): Candidate {
  const all = [...candidates, { bytes: sourceBytes, score: 100 }];
  const improving = all.filter((item) => item.bytes.length <= sourceBytes.length);
  const pool = improving.length ? improving : all;

  if (targetBytes == null) {
    return pool.reduce((best, current) =>
      current.bytes.length < best.bytes.length ? current : best,
    );
  }

  const reachesTarget = pool
    .filter((item) => item.bytes.length <= targetBytes)
    .sort((a, b) => b.score - a.score || b.bytes.length - a.bytes.length);

  if (reachesTarget.length) {
    return reachesTarget[0];
  }

  return pool.reduce((best, current) =>
    current.bytes.length < best.bytes.length ? current : best,
  );
}

async function structuralCompress(
  sourceBytes: Uint8Array,
  options: { useObjectStreams: boolean; objectsPerTick: number },
) {
  const sourcePdf = await PDFDocument.load(sourceBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  const outputPdf = await PDFDocument.create();
  const pages = await outputPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach((page) => outputPdf.addPage(page));

  return outputPdf.save({
    useObjectStreams: options.useObjectStreams,
    addDefaultPage: false,
    objectsPerTick: options.objectsPerTick,
    updateFieldAppearances: false,
  });
}

async function assertPdfReadable(bytes: Uint8Array) {
  await PDFDocument.load(bytes, { ignoreEncryption: true });
}

function parseCompressionLevel(raw: FormDataEntryValue | null): CompressionLevel {
  if (raw === "low" || raw === "medium" || raw === "high") {
    return raw;
  }
  return "medium";
}

function parseTargetBytes(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < MIN_TARGET_BYTES) return null;
  return parsed;
}

function getProfilesForLevel(level: CompressionLevel) {
  if (level === "low") {
    return [
      { useObjectStreams: true, objectsPerTick: 20, score: 90 },
      { useObjectStreams: false, objectsPerTick: 20, score: 80 },
    ];
  }

  if (level === "high") {
    return [
      { useObjectStreams: false, objectsPerTick: 120, score: 30 },
      { useObjectStreams: true, objectsPerTick: 120, score: 40 },
      { useObjectStreams: false, objectsPerTick: 20, score: 50 },
      { useObjectStreams: true, objectsPerTick: 20, score: 60 },
    ];
  }

  return [
    { useObjectStreams: false, objectsPerTick: 50, score: 60 },
    { useObjectStreams: true, objectsPerTick: 50, score: 70 },
    { useObjectStreams: false, objectsPerTick: 20, score: 80 },
    { useObjectStreams: true, objectsPerTick: 20, score: 85 },
  ];
}
