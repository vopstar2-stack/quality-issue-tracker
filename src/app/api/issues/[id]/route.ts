import { NextRequest } from "next/server";
import { del as deleteBlob } from "@vercel/blob";
import { deleteIssue, getIssue, updateIssue } from "@/lib/issues";
import { listPhotos } from "@/lib/photos";
import { parseIssueInput } from "@/lib/validate-issue";

export const runtime = "nodejs";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  const issue = await getIssue(id);
  if (!issue) {
    return Response.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ issue });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  if (!(await getIssue(id))) {
    return Response.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseIssueInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const issue = await updateIssue(id, parsed);
  return Response.json({ issue });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  if (!(await getIssue(id))) {
    return Response.json({ error: "이슈를 찾을 수 없습니다." }, { status: 404 });
  }

  const photos = await listPhotos(id);
  await Promise.all(photos.map((photo) => deleteBlob(photo.url).catch(() => {})));

  await deleteIssue(id);
  return Response.json({ ok: true });
}
