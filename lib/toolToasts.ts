import { toast } from "sonner";

type ToolToastKind = "success" | "error" | "warning" | "info";

const show = (kind: ToolToastKind, message: string) => {
  const text = message.trim();
  if (!text) return;
  toast[kind](text);
};

export const toolToast = {
  success: (message: string) => show("success", message),
  error: (message: string) => show("error", message),
  warning: (message: string) => show("warning", message),
  info: (message: string) => show("info", message),
};

