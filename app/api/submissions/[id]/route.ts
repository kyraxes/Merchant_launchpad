import { NextResponse } from "next/server";
import { verifyLineIdToken } from "@/lib/server/line-auth";
import { deleteSubmission, getSubmission } from "@/lib/server/submission-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await verifyLineIdToken(request.headers.get("authorization"));
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/.test(id)) return NextResponse.json({ error: "INVALID_SUBMISSION_ID" }, { status: 400 });
    const submission = await getSubmission(id);
    if (!submission || submission.ownerLineUserId !== identity.userId) return new NextResponse(null, { status: 204 });
    if (submission.status === "approved") return NextResponse.json({ error: "PUBLISHED_MERCHANT" }, { status: 409 });
    await deleteSubmission(submission);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const code = error instanceof Error ? error.message : "DELETE_FAILED";
    const status = code === "LINE_TOKEN_REQUIRED" || code === "INVALID_LINE_TOKEN" ? 401 : 400;
    return NextResponse.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
  }
}
