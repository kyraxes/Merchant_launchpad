import { NextResponse } from "next/server";
import { getSubmission, getSubmissionImage } from "@/lib/server/submission-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const kinds = ["storefront", "menu", "product"];

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (!/^[a-f0-9]{24}$/.test(id) || !kinds.includes(kind)) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const submission = await getSubmission(id);
  if (!submission || submission.status !== "approved" || !submission.imageKeys[kind as keyof typeof submission.imageKeys]) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const dataUrl = await getSubmissionImage(id, kind);
  const match = dataUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
  if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  return new NextResponse(Buffer.from(match[2], "base64"), {
    headers: {
      "content-type": match[1],
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
