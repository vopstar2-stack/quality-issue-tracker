import { NextRequest } from "next/server";
import { deleteMemo, getMemo, updateMemo } from "@/lib/memos";
import { deleteImages, parseImageUrls } from "@/lib/memo-images";

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

  const current = await getMemo(id);
  if (!current) return Response.json({ error: "메모를 찾을 수 없습니다." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const patch: { content?: string; folder?: string; important?: boolean; images?: string[] } = {};
  if (typeof body?.content === "string") patch.content = body.content;
  if (typeof body?.folder === "string" && body.folder.trim()) patch.folder = body.folder.trim();
  if (typeof body?.important === "boolean") patch.important = body.important;
  const images = parseImageUrls(body?.images);
  if (images) patch.images = images;

  // 글도 사진도 모두 비는 저장은 막는다.
  const finalContent = patch.content ?? current.content;
  const finalImages = patch.images ?? current.images;
  if (!finalContent.trim() && finalImages.length === 0) {
    return Response.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }

  const memo = await updateMemo(id, patch);
  if (!memo) return Response.json({ error: "메모를 찾을 수 없습니다." }, { status: 404 });

  // 편집에서 뺀 사진은 저장 공간을 아끼려고 Blob에서도 지운다.
  if (patch.images) {
    await deleteImages(current.images.filter((url) => !memo.images.includes(url)));
  }
  return Response.json({ memo });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = parseId((await params).id);
  if (id === null) return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });
  const deleted = await deleteMemo(id);
  if (deleted) await deleteImages(deleted.images);
  return Response.json({ ok: true });
}
