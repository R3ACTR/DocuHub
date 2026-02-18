"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import {
  FeedbackCategory,
  saveToolFeedback,
  ToolFeedbackEntry,
} from "@/lib/toolFeedbackStorage";

type ToolFeedbackPromptProps = {
  toolId: string;
};

export default function ToolFeedbackPrompt({ toolId }: ToolFeedbackPromptProps) {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>("general");
  const [comment, setComment] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState("");

  const submit = async () => {
    if (rating < 1) {
      setError("Please choose a rating.");
      return;
    }

    const payload: ToolFeedbackEntry = {
      toolId,
      rating,
      category,
      comment: comment.trim(),
      submittedAt: new Date().toISOString(),
    };

    setError("");
    setSubmitStatus("saving");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to submit feedback.");
      }

      saveToolFeedback(payload);
      setSubmitStatus("saved");
    } catch (submitError) {
      console.error(submitError);
      saveToolFeedback(payload);
      setSubmitStatus("error");
      setError("Saved locally. Could not send to server.");
    }
  };

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-5 text-left">
      <h3 className="text-base font-semibold">How was this tool?</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Rate your experience and optionally share what can be improved.
      </p>

      <div className="mt-4 flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className="rounded p-1 hover:bg-muted"
            aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
          >
            <Star
              className={`h-6 w-6 ${value <= rating ? "fill-accent text-accent" : "text-muted-foreground"}`}
            />
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Category</label>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value as FeedbackCategory)}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="bug">Bug</option>
          <option value="suggestion">Suggestion</option>
          <option value="general">General Feedback</option>
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium mb-2">Comment (optional)</label>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          rows={4}
          placeholder="Tell us what worked or what should change..."
          className="w-full rounded-lg border border-border px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      {submitStatus === "saved" && (
        <p className="mt-3 text-sm text-success">Thanks. Feedback submitted.</p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={submitStatus === "saving" || submitStatus === "saved"}
        className={`mt-4 rounded-lg px-4 py-2 text-sm font-medium ${
          submitStatus === "saving" || submitStatus === "saved"
            ? "cursor-not-allowed bg-muted text-muted-foreground"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {submitStatus === "saving" ? "Submitting..." : submitStatus === "saved" ? "Submitted" : "Submit Feedback"}
      </button>
    </div>
  );
}

