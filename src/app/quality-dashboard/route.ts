import { list } from "@vercel/blob";
import { QUALITY_DASHBOARD_BLOB_PATHNAME } from "@/lib/quality-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { blobs } = await list({ prefix: QUALITY_DASHBOARD_BLOB_PATHNAME, limit: 1 });
  const latest = blobs[0];
  if (!latest) {
    return new Response(
      "아직 업로드된 대시보드가 없습니다. 사내 PC의 자동 업로드가 실행되면 채워집니다.",
      { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } },
    );
  }
  return Response.redirect(latest.url, 302);
}
