import { NextRequest } from "next/server";
import { deleteMemo, updateMemo } from "@/lib/memos";

export const runtime = "nodejs";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseId((await params).id);
  if (id === null) return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });

  const body = await request.json().catch(() => null);
  const patch: { content?: string; folder?: string; important?: boolean } = {};
  if (typeof body?.content === "string") {
    if (!body.content.trim()) {
      return Response.json({ error: "내용을 입력해주세요." }, { status: 400 });
    }
    patch.content = body.content;
  }
  if (typeof body?.folder === "string" && body.folder.trim()) patch.folder = body.folder.trim();
  if (typeof body?.important === "boolean") patch.important = body.important;

  const memo = await updateMemo(id, patch);
  if (!memo) return Response.json({ error: "메모를 찾을 수 없습니다." }, { status: 404 });
  return Response.json({ memo });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseId((await params).id);
  if (id === null) return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });
  await deleteMemo(id);
  return Response.json({ ok: true });
}
