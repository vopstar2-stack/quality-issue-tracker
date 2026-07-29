import { NextRequest } from "next/server";
import { del } from "@vercel/blob";
import { deletePhoto } from "@/lib/photos";

export const runtime = "nodejs";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; photoId: string }> },
) {
  const { photoId } = await params;
  const id = Number(photoId);
  if (!Number.isInteger(id) || id <= 0) {
    return Response.json({ error: "잘못된 사진 ID입니다." }, { status: 400 });
  }

  const deleted = await deletePhoto(id);
  if (!deleted) {
    return Response.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });
  }
  await del(deleted.url).catch(() => {});
  return Response.json({ ok: true });
}
