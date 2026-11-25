import { NextRequest } from "next/server";
import { put } from "@vercel/blob";

export const runtime = "nodejs";

// 클라이언트에서 이미 저화질로 줄여 올리므로 여유 있게만 제한한다.
const MAX_FILE_SIZE = 3 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "이미지 파일만 올릴 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "사진이 너무 큽니다 (최대 3MB)." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const blob = await put(`memos/${Date.now()}-${safeName}`, file, { access: "public" });
  return Response.json({ url: blob.url }, { status: 201 });
}
