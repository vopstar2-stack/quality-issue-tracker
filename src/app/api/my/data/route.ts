import { readLatestSnapshot } from "@/lib/mail-dashboard";
import { listItemState, listMemos } from "@/lib/my-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 내 할 일 앱이 한 번에 읽는 데이터: 메일에서 뽑은 할 일, 직접 온 메일, 완료 표시, 메모.
export async function GET() {
  const [snapshot, state, memos] = await Promise.all([
    readLatestSnapshot().catch(() => null),
    listItemState(),
    listMemos(),
  ]);
  return Response.json(
    {
      todos: Array.isArray(snapshot?.todos) ? snapshot.todos : [],
      direct: Array.isArray(snapshot?.direct) ? snapshot.direct : [],
      lastRunAt: (snapshot?.meta as { lastRunAt?: string } | null)?.lastRunAt ?? null,
      exportedAt: snapshot?.exportedAt ?? null,
      state,
      memos,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
