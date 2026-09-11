import { NextRequest } from "next/server";
import { addTankReplacementReceipt, getTankReplacement } from "@/lib/tank-replacements";
import { parseTankReplacementReceiptInput } from "@/lib/validate-tank-replacement";

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
  if (!(await getTankReplacement(id))) {
    return Response.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseTankReplacementReceiptInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }

  const receipt = await addTankReplacementReceipt(id, parsed);
  return Response.json({ receipt }, { status: 201 });
}
