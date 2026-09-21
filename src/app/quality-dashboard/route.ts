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

  // Vercel Blob이 .html을 기본적으로 Content-Disposition: attachment로 내려주기 때문에
  // (즉시 열리는 게 아니라 다운로드됨), blob URL로 그냥 리다이렉트하는 대신 여기서
  // 내용을 직접 가져와 우리 쪽 Content-Type만 붙여서 돌려준다 - 그러면 브라우저가
  // 바로 페이지로 렌더링한다.
  const blobResponse = await fetch(latest.url, { cache: "no-store" });
  if (!blobResponse.ok || !blobResponse.body) {
    return new Response("대시보드를 불러오지 못했습니다.", { status: 502 });
  }

  return new Response(blobResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
