import { NextRequest } from "next/server";
import { setItemState } from "@/lib/my-app";

export const runtime = "nodejs";

// 메일 할 일(todo:<id>)·직접 온 메일(direct:<id>)의 완료/확인 표시를 저장한다.
export async function PUT(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { key?: unknown; done?: unknown } | null;
  const key = typeof body?.key === "string" ? body.key.trim() : "";
  if (!/^(todo|direct):[\w\-.~:@+]{1,200}$/.test(key) || typeof body?.done !== "boolean") {
    return Response.json({ error: "key 또는 done 값이 올바르지 않습니다." }, { status: 400 });
  }
  await setItemState(key, body.done);
  return Response.json({ ok: true });
}
