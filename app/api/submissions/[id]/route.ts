import { NextResponse } from "next/server";
import { verifyLineIdToken } from "@/lib/server/line-auth";
import { deleteSubmission, getSubmission, updateSubmission, updateSubmissionImages } from "@/lib/server/submission-store";
import { parseSubmissionInput, publicSubmission } from "@/lib/submissions";
import { requireSameOrigin } from "@/lib/server/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
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
    const status = code === "LINE_TOKEN_REQUIRED" || code === "INVALID_LINE_TOKEN" ? 401 : code === "ORIGIN_NOT_ALLOWED" ? 403 : 400;
    return NextResponse.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 5_000_000) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    const identity = await verifyLineIdToken(request.headers.get("authorization"));
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/.test(id)) return NextResponse.json({ error: "INVALID_SUBMISSION_ID" }, { status: 400 });
    const existing = await getSubmission(id);
    if (!existing || existing.ownerLineUserId !== identity.userId) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const input = parseSubmissionInput(await request.json());
    const now = new Date().toISOString();
    const imageKeys = await updateSubmissionImages(existing, input.images);
    const updated = {
      ...existing,
      locale: input.locale,
      name: input.name,
      category: input.category,
      address: input.address,
      phone: input.phone,
      hours: input.hours,
      lineId: input.lineId,
      imageKeys,
      status: "review" as const,
      updatedAt: now,
      reviewedAt: null,
    };
    await updateSubmission(updated);
    return NextResponse.json({ submission: publicSubmission(updated) }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = error instanceof Error ? error.message : "UPDATE_FAILED";
    const status = code === "LINE_TOKEN_REQUIRED" || code === "INVALID_LINE_TOKEN"
      ? 401
      : code === "ORIGIN_NOT_ALLOWED"
        ? 403
      : code === "MISSING_REQUIRED_FIELDS" || code === "INVALID_LOCALE"
        ? 422
        : code === "INVALID_IMAGE" || code === "PAYLOAD_TOO_LARGE"
          ? 413
          : 400;
    return NextResponse.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
  }
}
