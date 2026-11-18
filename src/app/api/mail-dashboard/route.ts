import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import {
  MAIL_DASHBOARD_BLOB_PATHNAME,
  MAIL_DASHBOARD_MAX_BYTES,
  fetchLatestSnapshotResponse,
  validateMailDashboardSnapshot,
} from "@/lib/mail-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 사내 PC가 메일 정리 결과(JSON)를 올린다. 품질검사 대시보드와 같은 업로드 토큰을 쓴다.
export async function POST(request: NextRequest) {
  const expected = process.env.QUALITY_DASHBOARD_UPLOAD_TOKEN;
  if (!expected) {
    return Response.json({ error: "QUALITY_DASHBOARD_UPLOAD_TOKEN 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "인증에 실패했습니다." }, { status: 401 });
  }

  const text = await request.text();
  if (!text.trim()) {
    return Response.json({ error: "업로드할 내용이 비어 있습니다." }, { status: 400 });
  }
  if (Buffer.byteLength(text, "utf8") > MAIL_DASHBOARD_MAX_BYTES) {
    return Response.json({ error: "업로드 크기가 너무 큽니다." }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return Response.json({ error: "JSON 형식이 아닙니다." }, { status: 400 });
  }
  const problem = validateMailDashboardSnapshot(parsed);
  if (problem) {
    return Response.json({ error: problem }, { status: 400 });
  }
  const next = parsed as Record<string, unknown>;

  const uploadedAt = new Date().toISOString();
  await put(MAIL_DASHBOARD_BLOB_PATHNAME, JSON.stringify({ ...next, exportedAt: uploadedAt }), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json; charset=utf-8",
    // 하루 여러 번 덮어쓰므로 CDN 캐시는 최소값만 둔다(품질검사 대시보드와 같은 이유).
    cacheControlMaxAge: 60,
  });

  return Response.json({ ok: true, uploadedAt });
}

// 웹 상황판(public/mail-dashboard.html)이 이 데이터를 읽는다.
export async function GET() {
  const res = await fetchLatestSnapshotResponse();
  if (!res || !res.body) {
    return Response.json({ error: "아직 업로드된 메일 상황판이 없습니다." }, { status: 404 });
  }
  return new Response(res.body, {
    status: 200,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
