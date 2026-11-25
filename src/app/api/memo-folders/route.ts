import { NextRequest } from "next/server";
import { createMemoFolder, deleteMemoFolder } from "@/lib/memos";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return Response.json({ error: "폴더 이름을 입력해주세요." }, { status: 400 });
  await createMemoFolder(name);
  return Response.json({ name }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name : "";
  if (!name) return Response.json({ error: "폴더 이름이 없습니다." }, { status: 400 });
  await deleteMemoFolder(name);
  return Response.json({ ok: true });
}
