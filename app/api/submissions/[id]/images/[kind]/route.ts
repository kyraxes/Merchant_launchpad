import { NextResponse } from "next/server";
import { verifyLineIdToken } from "@/lib/server/line-auth";
import { getSubmission, getSubmissionImage } from "@/lib/server/submission-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const kinds = ["storefront", "menu", "product"] as const;

export async function GET(request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  try {
    const identity = await verifyLineIdToken(request.headers.get("authorization"));
    const { id, kind } = await params;
    if (!/^[a-f0-9]{24}$/.test(id) || !kinds.includes(kind as typeof kinds[number])) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const submission = await getSubmission(id);
    const imageKind = kind as typeof kinds[number];
    if (!submission || submission.ownerLineUserId !== identity.userId || !submission.imageKeys[imageKind]) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const dataUrl = await getSubmissionImage(id, imageKind);
    const match = dataUrl?.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
    if (!match) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    return new NextResponse(Buffer.from(match[2], "base64"), {
      headers: {
        "content-type": match[1],
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const code = error instanceof Error ? error.message : "IMAGE_READ_FAILED";
    const status = code === "LINE_TOKEN_REQUIRED" || code === "INVALID_LINE_TOKEN" ? 401 : 500;
    return NextResponse.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
  }
}
