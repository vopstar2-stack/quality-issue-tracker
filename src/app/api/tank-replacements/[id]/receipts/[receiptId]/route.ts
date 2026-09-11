import { NextRequest } from "next/server";
import { deleteTankReplacementReceipt, getTankReplacement } from "@/lib/tank-replacements";

export const runtime = "nodejs";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; receiptId: string }> },
) {
  const { id: idParam, receiptId: receiptIdParam } = await params;
  const id = parseId(idParam);
  const receiptId = parseId(receiptIdParam);
  if (id === null || receiptId === null) {
    return Response.json({ error: "잘못된 ID입니다." }, { status: 400 });
  }
  if (!(await getTankReplacement(id))) {
    return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }

  await deleteTankReplacementReceipt(id, receiptId);
  return Response.json({ ok: true });
}
