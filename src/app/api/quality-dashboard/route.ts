import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { QUALITY_DASHBOARD_BLOB_PATHNAME } from "@/lib/quality-dashboard";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const expected = process.env.QUALITY_DASHBOARD_UPLOAD_TOKEN;
  if (!expected) {
    return Response.json({ error: "QUALITY_DASHBOARD_UPLOAD_TOKEN 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return Response.json({ error: "인증에 실패했습니다." }, { status: 401 });
  }

  const html = await request.text();
  if (!html.trim()) {
    return Response.json({ error: "업로드할 내용이 비어 있습니다." }, { status: 400 });
  }

  const blob = await put(QUALITY_DASHBOARD_BLOB_PATHNAME, html, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "text/html; charset=utf-8",
  });

  return Response.json({ ok: true, url: blob.url, uploadedAt: new Date().toISOString() });
}
