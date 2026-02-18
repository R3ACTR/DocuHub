import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "pdf-lib";
import { scanBytesForThreat } from "@/lib/security/virusScan";

export const runtime = "nodejs";

type CompressionLevel = "low" | "medium" | "high";
type CompressionStatus = "no_target" | "target_reached" | "target_unreachable";
type RewriteMode = "direct" | "rebuilt";

type Candidate = {
  bytes: Uint8Array;
  profile: CompressionProfile;
};

type CompressionProfile = {
  id: string;
  useObjectStreams: boolean;
  objectsPerTick: number;
  rewriteMode: RewriteMode;
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
    const threatScan = scanBytesForThreat(sourceBytes, file.name, file.type);
    if (!threatScan.safe) {
      return NextResponse.json(
        { error: threatScan.threat || "Security scan failed for uploaded file." },
        { status: 400 },
      );
    }
    await assertPdfReadable(sourceBytes);

    const candidates = await buildCandidates(sourceBytes, level);
    const selected = selectCandidate(sourceBytes, candidates, level, targetBytes);

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
      settings: {
        requestedLevel: level,
        appliedLevel: level,
        useObjectStreams: selected.profile.useObjectStreams,
        rewriteMode: selected.profile.rewriteMode,
      },
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
  const unique = new Map<string, Candidate>();

  for (const profile of profiles) {
    try {
      const bytes = await structuralCompress(sourceBytes, {
        useObjectStreams: profile.useObjectStreams,
        objectsPerTick: profile.objectsPerTick,
        rewriteMode: profile.rewriteMode,
      });
      const key = `${bytes.length}-${profile.rewriteMode}-${profile.useObjectStreams}`;
      const existing = unique.get(key);
      if (!existing) {
        unique.set(key, { bytes, profile });
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
  level: CompressionLevel,
  targetBytes: number | null,
): Candidate {
  const sourceCandidate: Candidate = {
    bytes: sourceBytes,
    profile: {
      id: "source",
      useObjectStreams: false,
      objectsPerTick: 20,
      rewriteMode: "direct",
    },
  };
  const improving = candidates.filter((item) => item.bytes.length <= sourceBytes.length);
  if (!improving.length) {
    return sourceCandidate;
  }

  if (targetBytes == null) {
    return chooseByLevel(improving, level);
  }

  const reachesTarget = improving.filter((item) => item.bytes.length <= targetBytes);

  if (reachesTarget.length) {
    return chooseByLevel(reachesTarget, level);
  }

  return chooseByLevel(improving, level);
}

async function structuralCompress(
  sourceBytes: Uint8Array,
  options: {
    useObjectStreams: boolean;
    objectsPerTick: number;
    rewriteMode: RewriteMode;
  },
) {
  const sourcePdf = await PDFDocument.load(sourceBytes, {
    ignoreEncryption: true,
    updateMetadata: false,
  });
  if (options.rewriteMode === "direct") {
    return sourcePdf.save({
      useObjectStreams: options.useObjectStreams,
      addDefaultPage: false,
      objectsPerTick: options.objectsPerTick,
      updateFieldAppearances: false,
    });
  }

  const rebuiltPdf = await PDFDocument.create();
  const pages = await rebuiltPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());
  pages.forEach((page) => rebuiltPdf.addPage(page));

  return rebuiltPdf.save({
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

function chooseByLevel(candidates: Candidate[], level: CompressionLevel): Candidate {
  const sorted = [...candidates].sort((a, b) => a.bytes.length - b.bytes.length);
  if (level === "high") return sorted[0];
  if (level === "low") return sorted[sorted.length - 1];
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

function getProfilesForLevel(level: CompressionLevel) {
  if (level === "low") {
    return [
      {
        id: "low-direct-no-streams",
        useObjectStreams: false,
        objectsPerTick: 30,
        rewriteMode: "direct" as const,
      },
      {
        id: "low-rebuilt-no-streams",
        useObjectStreams: false,
        objectsPerTick: 30,
        rewriteMode: "rebuilt" as const,
      },
      {
        id: "low-direct-streams",
        useObjectStreams: true,
        objectsPerTick: 30,
        rewriteMode: "direct" as const,
      },
    ];
  }

  if (level === "high") {
    return [
      {
        id: "high-rebuilt-streams",
        useObjectStreams: true,
        objectsPerTick: 100,
        rewriteMode: "rebuilt" as const,
      },
      {
        id: "high-direct-streams",
        useObjectStreams: true,
        objectsPerTick: 100,
        rewriteMode: "direct" as const,
      },
      {
        id: "high-rebuilt-no-streams",
        useObjectStreams: false,
        objectsPerTick: 100,
        rewriteMode: "rebuilt" as const,
      },
    ];
  }

  return [
    {
      id: "medium-direct-no-streams",
      useObjectStreams: false,
      objectsPerTick: 50,
      rewriteMode: "direct" as const,
    },
    {
      id: "medium-rebuilt-no-streams",
      useObjectStreams: false,
      objectsPerTick: 50,
      rewriteMode: "rebuilt" as const,
    },
    {
      id: "medium-direct-streams",
      useObjectStreams: true,
      objectsPerTick: 50,
      rewriteMode: "direct" as const,
    },
    {
      id: "medium-rebuilt-streams",
      useObjectStreams: true,
      objectsPerTick: 50,
      rewriteMode: "rebuilt" as const,
    },
  ];
}
