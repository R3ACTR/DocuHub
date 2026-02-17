export type FeedbackCategory = "bug" | "suggestion" | "general";

export type ToolFeedbackEntry = {
  toolId: string;
  rating: number;
  category: FeedbackCategory;
  comment: string;
  submittedAt: string;
};

const FEEDBACK_STORAGE_KEY = "docuhub-tool-feedback";

export function saveToolFeedback(entry: ToolFeedbackEntry) {
  if (typeof window === "undefined") return;

  try {
    const current = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    const parsed = current ? (JSON.parse(current) as ToolFeedbackEntry[]) : [];
    parsed.unshift(entry);
    localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error("Failed to save tool feedback", error);
  }
}
