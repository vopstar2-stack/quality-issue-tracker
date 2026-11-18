import { NextRequest } from "next/server";
import { getMailAuthStatus, sendPushToAll, setMailAuthStatus } from "@/lib/my-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 사내 PC의 메일 정리 예약 작업이 Outlook 연결 상태를 알린다(메일 상황판 업로드와 같은 토큰).
// body: { ok: boolean, message?: string }
// ok:false → 상태 기록 + 구독 폰에 푸시. ok:true → 끊겼던 상태였으면 복구로 기록하고 "다시 연결됨" 푸시.
export async function POST(request: NextRequest) {
  const expected = process.env.QUALITY_DASHBOARD_UPLOAD_TOKEN;
  if (!expected) {
    return Response.json({ error: "QUALITY_DASHBOARD_UPLOAD_TOKEN 환경변수가 설정되지 않았습니다." }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${expected}`) {
    return Response.json({ error: "인증에 실패했습니다." }, { status: 401 });
  }

  let body: { ok?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSON 형식이 아닙니다." }, { status: 400 });
  }
  if (typeof body.ok !== "boolean") {
    return Response.json({ error: "ok(true/false)가 필요합니다." }, { status: 400 });
  }
  const message = typeof body.message === "string" ? body.message.slice(0, 300) : "";
  const now = new Date().toISOString();
  const prev = await getMailAuthStatus();

  if (!body.ok) {
    const since = prev && !prev.ok ? prev.since ?? prev.at : now;
    await setMailAuthStatus({ ok: false, at: now, message, since });
    const push = await sendPushToAll([
      {
        title: "메일 연결이 끊겼어요 — 재인증 필요",
        body: (message ? message + " " : "") + "Claude 앱 커넥터에서 Microsoft 365를 다시 연결해 주세요.",
        url: "/todo.html#todos",
        tag: "mail-auth",
      },
    ]).catch(() => ({ sent: 0, failed: 1 }));
    return Response.json({ ok: true, recorded: "down", push });
  }

  await setMailAuthStatus({ ok: true, at: now, message: "" });
  let push = { sent: 0, failed: 0 };
  if (prev && !prev.ok) {
    push = await sendPushToAll([
      { title: "메일 다시 연결됐어요", body: "메일 정리가 정상으로 돌아왔어요.", url: "/todo.html#todos", tag: "mail-auth" },
    ]).catch(() => ({ sent: 0, failed: 1 }));
  }
  return Response.json({ ok: true, recorded: "up", push });
}
