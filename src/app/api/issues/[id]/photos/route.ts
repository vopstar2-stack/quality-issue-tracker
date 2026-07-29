import { NextRequest } from "next/server";
import { put } from "@vercel/blob";
import { getIssue } from "@/lib/issues";
import { addPhoto, listPhotos } from "@/lib/photos";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB safety cap; the client already resizes before upload.

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const issueId = parseId(idParam);
  if (issueId === null) {
    return Response.json({ error: "잘못된 이슈 ID입니다." }, { status: 400 });
  }
  const photos = await listPhotos(issueId);
  return Response.json({ photos });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const issueId = parseId(idParam);
  if (issueId === null) {
    return Response.json({ error: "잘못된 이슈 ID입니다." }, { status: 400 });
  }
  const issue = await getIssue(issueId);
  if (!issue) {
    return Response.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "파일이 없습니다." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "이미지 파일만 업로드할 수 있습니다." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "파일이 너무 큽니다 (최대 8MB)." }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `issues/${issueId}/${Date.now()}-${safeName}`;
  const blob = await put(key, file, { access: "public" });
  const photo = await addPhoto(issueId, blob.url);
  return Response.json({ photo }, { status: 201 });
}
