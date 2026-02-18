export type ThreatScanResult = {
  safe: boolean;
  threat?: string;
};

const EICAR_SIGNATURE =
  "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";

const DANGEROUS_EXTENSIONS = new Set([
  ".ade",
  ".adp",
  ".app",
  ".bat",
  ".chm",
  ".cmd",
  ".com",
  ".cpl",
  ".dll",
  ".exe",
  ".hta",
  ".ins",
  ".isp",
  ".jar",
  ".js",
  ".jse",
  ".lib",
  ".lnk",
  ".mde",
  ".msc",
  ".msi",
  ".msp",
  ".mst",
  ".pif",
  ".ps1",
  ".scr",
  ".sct",
  ".sh",
  ".sys",
  ".vb",
  ".vbe",
  ".vbs",
  ".vxd",
  ".ws",
  ".wsc",
  ".wsf",
  ".wsh",
]);

const DANGEROUS_MIME_SNIPPETS = [
  "application/x-msdownload",
  "application/x-msdos-program",
  "application/x-dosexec",
  "application/x-msi",
  "application/java-archive",
  "application/x-sh",
  "text/x-shellscript",
  "application/x-powershell",
];

export function scanBytesForThreat(
  bytes: Uint8Array,
  fileName: string,
  mimeType?: string,
): ThreatScanResult {
  const normalizedName = fileName.toLowerCase();
  const ext = normalizedName.includes(".")
    ? `.${normalizedName.split(".").pop() ?? ""}`
    : "";
  const normalizedMime = (mimeType ?? "").toLowerCase();

  if (DANGEROUS_EXTENSIONS.has(ext)) {
    return {
      safe: false,
      threat: `${fileName}: blocked executable/script file type (${ext}).`,
    };
  }

  if (
    normalizedMime &&
    DANGEROUS_MIME_SNIPPETS.some((snippet) => normalizedMime.includes(snippet))
  ) {
    return {
      safe: false,
      threat: `${fileName}: blocked executable/script MIME type (${normalizedMime}).`,
    };
  }

  if (bytes.length >= 2 && bytes[0] === 0x4d && bytes[1] === 0x5a) {
    return {
      safe: false,
      threat: `${fileName}: executable payload detected (MZ header).`,
    };
  }

  const content = new TextDecoder("latin1").decode(bytes);
  if (content.includes(EICAR_SIGNATURE)) {
    return {
      safe: false,
      threat: `${fileName}: EICAR malware test signature detected.`,
    };
  }

  return { safe: true };
}

export async function scanUploadedFiles(files: File[]) {
  const cleanFiles: File[] = [];
  const threats: string[] = [];

  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const result = scanBytesForThreat(bytes, file.name, file.type);
    if (result.safe) {
      cleanFiles.push(file);
    } else if (result.threat) {
      threats.push(result.threat);
    }
  }

  return { cleanFiles, threats };
}

export function buildThreatWarning(threats: string[]) {
  if (!threats.length) return "";
  if (threats.length === 1) {
    return `Security scan failed. ${threats[0]}`;
  }
  return `Security scan failed for ${threats.length} files: ${threats.join(" ")}`;
}
