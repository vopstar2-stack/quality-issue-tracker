import { NextRequest } from "next/server";
import { createMemo, listMemoFolders, listMemos } from "@/lib/memos";
import { parseImageUrls } from "@/lib/memo-images";
import { DEFAULT_MEMO_FOLDER } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const [memos, folders] = await Promise.all([listMemos(), listMemoFolders()]);
  return Response.json({ memos, folders });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const content = typeof body?.content === "string" ? body.content : "";
  const images = parseImageUrls(body?.images) ?? [];
  // 사진만 올리고 글은 안 써도 메모가 되게 한다.
  if (!content.trim() && images.length === 0) {
    return Response.json({ error: "내용을 입력해주세요." }, { status: 400 });
  }
  const folder =
    typeof body?.folder === "string" && body.folder.trim() ? body.folder.trim() : DEFAULT_MEMO_FOLDER;
  const memo = await createMemo({ content, folder, important: body?.important === true, images });
  return Response.json({ memo }, { status: 201 });
}
