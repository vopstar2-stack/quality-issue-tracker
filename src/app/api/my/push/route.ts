import { NextRequest } from "next/server";
import { removeSubscription, saveSubscription, sendPushToAll, vapidPublicKey } from "@/lib/my-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 앱이 구독할 때 쓰는 공개 키
export async function GET() {
  const key = vapidPublicKey();
  if (!key) return Response.json({ error: "푸시 키가 설정되지 않았습니다." }, { status: 503 });
  return Response.json({ publicKey: key });
}

type SubBody = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown }; test?: unknown };

function isPushEndpoint(v: unknown): v is string {
  if (typeof v !== "string" || v.length > 1000) return false;
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}

// 구독 저장. { test: true }를 함께 보내면 저장 직후 이 폰에 확인 알림을 보낸다.
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SubBody | null;
  const p256dh = body?.keys?.p256dh;
  const auth = body?.keys?.auth;
  if (!isPushEndpoint(body?.endpoint) || typeof p256dh !== "string" || typeof auth !== "string") {
    return Response.json({ error: "구독 정보가 올바르지 않습니다." }, { status: 400 });
  }
  await saveSubscription({ endpoint: body.endpoint, keys: { p256dh, auth } });
  let push = null;
  if (body.test === true) {
    push = await sendPushToAll([
      { title: "알림이 켜졌어요", body: "새 할 일이나 직접 온 메일이 생기면 이렇게 알려드려요.", url: "/todo.html", tag: "welcome" },
    ]);
  }
  return Response.json({ ok: true, push });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SubBody | null;
  if (!isPushEndpoint(body?.endpoint)) return Response.json({ error: "endpoint가 필요합니다." }, { status: 400 });
  await removeSubscription(body.endpoint);
  return Response.json({ ok: true });
}
