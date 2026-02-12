const STORAGE_PREFIX = "docuhub-tool-state";

export function saveToolState(toolId: string, state: any) {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.setItem(
      `${STORAGE_PREFIX}-${toolId}`,
      JSON.stringify(state)
    );
  } catch (err) {
    console.error("Failed to save tool state", err);
  }
}

export function loadToolState(toolId: string) {
  if (typeof window === "undefined") return null;

  try {
    const data = sessionStorage.getItem(`${STORAGE_PREFIX}-${toolId}`);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error("Failed to load tool state", err);
    return null;
  }
}

export function clearToolState(toolId: string) {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`${STORAGE_PREFIX}-${toolId}`);
}
