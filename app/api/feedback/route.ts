import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type FeedbackCategory = "bug" | "suggestion" | "general";

type FeedbackRequest = {
  toolId: string;
  rating: number;
  category: FeedbackCategory;
  comment?: string;
  submittedAt?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FeedbackRequest;

    if (!body.toolId || typeof body.toolId !== "string") {
      return NextResponse.json({ error: "toolId is required." }, { status: 400 });
    }

    if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
      return NextResponse.json({ error: "rating must be between 1 and 5." }, { status: 400 });
    }

    if (!["bug", "suggestion", "general"].includes(body.category)) {
      return NextResponse.json({ error: "Invalid feedback category." }, { status: 400 });
    }

    if (typeof body.comment === "string" && body.comment.length > 1000) {
      return NextResponse.json({ error: "Comment is too long." }, { status: 400 });
    }

    console.info("Tool feedback received", {
      toolId: body.toolId,
      rating: body.rating,
      category: body.category,
      submittedAt: body.submittedAt || new Date().toISOString(),
      commentLength: body.comment?.trim().length || 0,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Feedback API failed", error);
    return NextResponse.json({ error: "Failed to process feedback." }, { status: 500 });
  }
}
