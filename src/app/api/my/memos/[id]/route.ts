import { NextRequest } from "next/server";
import { deleteMemo, updateMemo } from "@/lib/my-app";
import { parseMemoInput } from "@/lib/validate-memo";

export const runtime = "nodejs";

function memoId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = memoId((await params).id);
  if (!id) return Response.json({ error: "메모 번호가 올바르지 않습니다." }, { status: 400 });
  const parsed = parseMemoInput(await request.json().catch(() => null), false);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const memo = await updateMemo(id, parsed);
  if (!memo) return Response.json({ error: "메모를 찾지 못했습니다." }, { status: 404 });
  return Response.json({ memo });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const id = memoId((await params).id);
  if (!id) return Response.json({ error: "메모 번호가 올바르지 않습니다." }, { status: 400 });
  await deleteMemo(id);
  return Response.json({ ok: true });
}
