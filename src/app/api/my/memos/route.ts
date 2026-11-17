import { NextRequest } from "next/server";
import { createMemo, listMemos } from "@/lib/my-app";
import { parseMemoInput } from "@/lib/validate-memo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({ memos: await listMemos() });
}

export async function POST(request: NextRequest) {
  const parsed = parseMemoInput(await request.json().catch(() => null), true);
  if ("error" in parsed) return Response.json({ error: parsed.error }, { status: 400 });
  const memo = await createMemo(parsed.body!, parsed.due ?? null);
  return Response.json({ memo }, { status: 201 });
}
