import { NextRequest } from "next/server";
import { createTankReplacement, listTankReplacements } from "@/lib/tank-replacements";
import { parseTankReplacementInput } from "@/lib/validate-tank-replacement";

export const runtime = "nodejs";

export async function GET() {
  const tankReplacements = await listTankReplacements();
  return Response.json({ tankReplacements });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseTankReplacementInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const tankReplacement = await createTankReplacement(parsed);
  return Response.json({ tankReplacement }, { status: 201 });
}
