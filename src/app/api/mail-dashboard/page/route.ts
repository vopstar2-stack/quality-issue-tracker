import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import {
  MAIL_DASHBOARD_PAGE_MAX_BYTES,
  MAIL_DASHBOARD_PAGE_PATHNAME,
  fetchLatestPageHtml,
} from "@/lib/mail-dashboard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// /mail-dashboard.html 은 next.config 의 rewrite로 여기로 온다.
// 메일 정리가 올린 최신 화면(blob)을 돌려주고, 아직 없으면 배포에 들어 있는 기본 사본을 돌려준다.
export async function GET(request: NextRequest) {
  const html = await fetchLatestPageHtml().catch(() => null);
  if (html) {
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }
  const base = await fetch(new URL("/mail-dashboard-base.html", request.url), { cache: "no-store" });
  return new Response(base.body, {
    status: base.status,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

// 사내 PC가 최신 화면을 올린다. 데이터 업로드와 같은 토큰을 쓴다.
export async function POST(request: NextRequest) {
  const expected = process.env.QUALITY_DASHBOARD_UPLOAD_TOKEN;
  if (!expected) {
    return Response.json({ error: "QUALITY_DASHBOARD_UPLOAD_TOKEN 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "인증에 실패했습니다." }, { status: 401 });
  }
  const html = await request.text();
  if (!/^<!doctype html>/i.test(html.trimStart()) || !html.includes('name="mail-dashboard-source"')) {
    return Response.json({ error: "상황판 HTML이 아닙니다." }, { status: 400 });
  }
  if (Buffer.byteLength(html, "utf8") > MAIL_DASHBOARD_PAGE_MAX_BYTES) {
    return Response.json({ error: "화면 파일이 너무 큽니다." }, { status: 413 });
  }
  await put(MAIL_DASHBOARD_PAGE_PATHNAME, html, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "text/html; charset=utf-8",
    cacheControlMaxAge: 60,
  });
  return Response.json({ ok: true, bytes: Buffer.byteLength(html, "utf8") });
}
