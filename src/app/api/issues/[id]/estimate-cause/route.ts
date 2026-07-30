import { NextRequest } from "next/server";
import { getIssue } from "@/lib/issues";
import { listPhotos } from "@/lib/photos";
import { estimateCause } from "@/lib/anthropic";

export const runtime = "nodejs";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(
  request: NextRequest,
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

  const body = await request.json().catch(() => null);
  const description = typeof body?.description === "string" ? body.description : issue.description;
  const cause = typeof body?.cause === "string" ? body.cause : issue.cause;

  const photos = await listPhotos(id);

  try {
    const text = await estimateCause({
      description,
      cause,
      photoUrls: photos.map((p) => p.url),
    });
    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json(
      { error: err instanceof Error ? err.message : "AI 추정 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
