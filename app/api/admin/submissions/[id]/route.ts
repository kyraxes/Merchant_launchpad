import { NextResponse } from "next/server";
import { adminErrorStatus, requireAdmin } from "@/lib/server/admin-auth";
import { getSubmission, updateSubmission } from "@/lib/server/submission-store";
import type { SubmissionStatus } from "@/lib/submissions";
import { requireSameOrigin } from "@/lib/server/request-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedStatuses: SubmissionStatus[] = ["review", "approved", "rejected"];

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    requireAdmin(request);
    const { id } = await params;
    if (!/^[a-f0-9]{24}$/.test(id)) return NextResponse.json({ error: "INVALID_SUBMISSION_ID" }, { status: 400 });
    const body = await request.json() as { status?: SubmissionStatus };
    if (!body.status || !allowedStatuses.includes(body.status)) return NextResponse.json({ error: "INVALID_STATUS" }, { status: 422 });
    const existing = await getSubmission(id);
    if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    const now = new Date().toISOString();
    const updated = { ...existing, status: body.status, updatedAt: now, reviewedAt: body.status === "review" ? null : now };
    await updateSubmission(updated);
    return NextResponse.json({ submission: updated }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ADMIN_ERROR" }, {
      status: adminErrorStatus(error),
      headers: { "cache-control": "no-store" },
    });
  }
}
