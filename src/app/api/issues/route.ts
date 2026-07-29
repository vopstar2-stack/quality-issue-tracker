import { NextRequest } from "next/server";
import { createIssue, listIssues } from "@/lib/issues";
import { parseIssueInput } from "@/lib/validate-issue";

export const runtime = "nodejs";

export async function GET() {
  const issues = await listIssues();
  return Response.json({ issues });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = parseIssueInput(body);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400 });
  }
  const issue = await createIssue(parsed);
  return Response.json({ issue }, { status: 201 });
}
