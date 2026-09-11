import { NextRequest } from "next/server";
import {
  deleteTankReplacement,
  getTankReplacement,
  updateTankReplacement,
} from "@/lib/tank-replacements";
import { parseTankReplacementInput } from "@/lib/validate-tank-replacement";

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
  const tankReplacement = await getTankReplacement(id);
  if (!tankReplacement) {
    return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }
  return Response.json({ tankReplacement });
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
  if (!(await getTankReplacement(id))) {
    return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseTankReplacementInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const tankReplacement = await updateTankReplacement(id, parsed);
  return Response.json({ tankReplacement });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  if (!(await getTankReplacement(id))) {
    return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (body?.code !== process.env.DELETE_CONFIRM_CODE) {
    return Response.json({ error: "확인 코드가 올바르지 않습니다." }, { status: 403 });
  }

  await deleteTankReplacement(id);
  return Response.json({ ok: true });
}
