import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { parseSubmissionInput, publicSubmission, type MerchantSubmission } from "@/lib/submissions";
import { verifyLineIdToken } from "@/lib/server/line-auth";
import { createSubmission, listSubmissions } from "@/lib/server/submission-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown) {
  const code = error instanceof Error ? error.message : "SUBMISSION_FAILED";
  const status = code === "LINE_TOKEN_REQUIRED" || code === "INVALID_LINE_TOKEN"
    ? 401
    : code === "OWNER_MERCHANT_EXISTS"
      ? 409
    : code === "MISSING_REQUIRED_FIELDS" || code === "INVALID_LOCALE"
      ? 422
      : code === "INVALID_IMAGE"
        ? 413
        : 400;
  return NextResponse.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > 5_000_000) return NextResponse.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
    const identity = await verifyLineIdToken(request.headers.get("authorization"));
    const input = parseSubmissionInput(await request.json());
    const existingSubmissions = await listSubmissions();
    const ownedSubmissions = existingSubmissions.filter((item) => item.ownerLineUserId === identity.userId);
    const duplicateStore = ownedSubmissions.find((item) => item.clientSubmissionId === input.clientSubmissionId || (
      item.name.toLocaleLowerCase() === input.name.toLocaleLowerCase() && item.phone === input.phone
    ));
    if (duplicateStore) {
      return NextResponse.json({ submission: publicSubmission(duplicateStore), duplicate: true }, {
        status: 200,
        headers: { "cache-control": "no-store" },
      });
    }
    if (ownedSubmissions.length) throw new Error("OWNER_MERCHANT_EXISTS");
    // The primary record ID is derived from the verified LINE owner, so two
    // simultaneous requests cannot create two separate merchant records.
    const id = createHash("sha256").update(`${identity.userId}:primary-merchant`).digest("hex").slice(0, 24);
    const submittedAt = new Date().toISOString();
    const imageKeys = {
      storefront: input.images.storefront ? `image/${id}/storefront` : null,
      menu: input.images.menu ? `image/${id}/menu` : null,
      product: input.images.product ? `image/${id}/product` : null,
    };
    const submission: MerchantSubmission = {
      id,
      clientSubmissionId: input.clientSubmissionId,
      ownerLineUserId: identity.userId,
      ownerDisplayName: identity.displayName,
      locale: input.locale,
      name: input.name,
      category: input.category,
      address: input.address,
      phone: input.phone,
      hours: input.hours,
      lineId: input.lineId,
      status: "review",
      imageKeys,
      submittedAt,
      updatedAt: submittedAt,
      reviewedAt: null,
    };
    const result = await createSubmission(submission, input.images);
    return NextResponse.json({ submission: publicSubmission(result.submission), duplicate: !result.created }, {
      status: result.created ? 201 : 200,
      headers: { "cache-control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: Request) {
  try {
    const identity = await verifyLineIdToken(request.headers.get("authorization"));
    const submissions = (await listSubmissions())
      .filter((item) => item.ownerLineUserId === identity.userId)
      .map(publicSubmission);
    return NextResponse.json({ submissions }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error);
  }
}
