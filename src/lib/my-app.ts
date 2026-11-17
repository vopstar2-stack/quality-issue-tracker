import webpush from "web-push";
import { query } from "./db";

// ---------- 메모 ----------
export type Memo = {
  id: number;
  body: string;
  due: string | null;
  done: boolean;
  pinned: boolean;
  created_at: string;
  updated_at: string;
};

type MemoRow = Omit<Memo, "created_at" | "updated_at"> & { created_at: string | Date; updated_at: string | Date };
const iso = (v: string | Date) => (v instanceof Date ? v.toISOString() : v);
const toMemo = (r: MemoRow): Memo => ({ ...r, created_at: iso(r.created_at), updated_at: iso(r.updated_at) });

export async function listMemos(): Promise<Memo[]> {
  const rows = await query<MemoRow>(
    "SELECT * FROM my_memos ORDER BY done ASC, pinned DESC, (due IS NULL) ASC, due ASC, updated_at DESC LIMIT 500",
  );
  return rows.map(toMemo);
}

export async function createMemo(body: string, due: string | null): Promise<Memo> {
  const [row] = await query<MemoRow>("INSERT INTO my_memos (body, due) VALUES ($1, $2) RETURNING *", [body, due]);
  return toMemo(row);
}

export async function updateMemo(
  id: number,
  patch: Partial<Pick<Memo, "body" | "due" | "done" | "pinned">>,
): Promise<Memo | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const key of ["body", "due", "done", "pinned"] as const) {
    if (patch[key] !== undefined) {
      params.push(patch[key]);
      sets.push(`${key} = $${params.length}`);
    }
  }
  if (!sets.length) return null;
  params.push(id);
  const [row] = await query<MemoRow>(
    `UPDATE my_memos SET ${sets.join(", ")}, updated_at = now() WHERE id = $${params.length} RETURNING *`,
    params,
  );
  return row ? toMemo(row) : null;
}

export async function deleteMemo(id: number): Promise<void> {
  await query("DELETE FROM my_memos WHERE id = $1", [id]);
}

// ---------- 메일 할 일 / 직접 온 메일의 완료·확인 상태 ----------
export async function listItemState(): Promise<Record<string, boolean>> {
  const rows = await query<{ item_key: string; done: boolean }>("SELECT item_key, done FROM my_item_state");
  return Object.fromEntries(rows.map((r) => [r.item_key, r.done]));
}

export async function setItemState(key: string, done: boolean): Promise<void> {
  await query(
    `INSERT INTO my_item_state (item_key, done, updated_at) VALUES ($1, $2, now())
     ON CONFLICT (item_key) DO UPDATE SET done = EXCLUDED.done, updated_at = now()`,
    [key, done],
  );
}

// ---------- 웹 푸시 ----------
export type PushPayload = { title: string; body: string; url?: string; tag?: string };

let vapidReady = false;
function ensureVapid(): boolean {
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  if (!vapidReady) {
    webpush.setVapidDetails("https://rayqc.vercel.app", pub, priv);
    vapidReady = true;
  }
  return true;
}

export function vapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

export async function saveSubscription(sub: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  await query(
    `INSERT INTO push_subscriptions (endpoint, p256dh, auth) VALUES ($1, $2, $3)
     ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
    [sub.endpoint, sub.keys.p256dh, sub.keys.auth],
  );
}

export async function removeSubscription(endpoint: string) {
  await query("DELETE FROM push_subscriptions WHERE endpoint = $1", [endpoint]);
}

// 모든 구독 폰에 보낸다. 만료된 구독(404/410)은 지운다. 보낸 수를 돌려준다.
export async function sendPushToAll(payloads: PushPayload[]): Promise<{ sent: number; failed: number }> {
  if (!payloads.length || !ensureVapid()) return { sent: 0, failed: 0 };
  const subs = await query<{ endpoint: string; p256dh: string; auth: string }>(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions",
  );
  let sent = 0;
  let failed = 0;
  for (const s of subs) {
    for (const p of payloads) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(p),
          { TTL: 60 * 60 * 12, urgency: "high" },
        );
        sent++;
      } catch (err) {
        failed++;
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await removeSubscription(s.endpoint);
          break;
        }
        console.error("web push failed", status, err);
      }
    }
  }
  return { sent, failed };
}

// ---------- 메일 정리 결과에서 새로 생긴 할 일·직접 온 메일 알림 만들기 ----------
type SnapshotItem = { id?: unknown; text?: unknown; status?: unknown; from?: unknown; subject?: unknown; gist?: unknown; due?: unknown };

function openIds(list: unknown, onlyOpen: boolean): Map<string, SnapshotItem> {
  const map = new Map<string, SnapshotItem>();
  if (!Array.isArray(list)) return map;
  for (const raw of list) {
    const item = raw as SnapshotItem;
    if (typeof item?.id !== "string") continue;
    if (onlyOpen && item.status === "closed") continue;
    map.set(item.id, item);
  }
  return map;
}

export function buildNewItemNotifications(prev: Record<string, unknown> | null, next: Record<string, unknown>): PushPayload[] {
  const prevTodos = openIds(prev?.todos, false);
  const prevDirect = openIds(prev?.direct, false);
  const newTodos = [...openIds(next.todos, true).entries()].filter(([id]) => !prevTodos.has(id)).map(([, v]) => v);
  const newDirect = [...openIds(next.direct, false).entries()].filter(([id]) => !prevDirect.has(id)).map(([, v]) => v);
  const out: PushPayload[] = [];
  const str = (v: unknown) => (typeof v === "string" ? v : "");

  if (newTodos.length === 1) {
    const t = newTodos[0];
    out.push({ title: "새 할 일", body: str(t.text) + (str(t.due) ? ` (기한 ${str(t.due)})` : ""), url: "/todo.html#todos", tag: "todos" });
  } else if (newTodos.length > 1) {
    out.push({
      title: `새 할 일 ${newTodos.length}건`,
      body: newTodos.slice(0, 3).map((t) => "· " + str(t.text)).join("\n") + (newTodos.length > 3 ? `\n외 ${newTodos.length - 3}건` : ""),
      url: "/todo.html#todos",
      tag: "todos",
    });
  }
  for (const d of newDirect.slice(0, 3)) {
    out.push({
      title: `직접 온 메일 · ${str(d.from)}`,
      body: str(d.gist) || str(d.subject),
      url: "/todo.html#direct",
      tag: "direct-" + str(d.id),
    });
  }
  if (newDirect.length > 3) {
    out.push({ title: `직접 온 메일 ${newDirect.length - 3}통 더`, body: "앱에서 확인하세요", url: "/todo.html#direct", tag: "direct-more" });
  }
  return out;
}
