import { query } from "./db";
import { DEFAULT_MEMO_FOLDER, type Memo } from "./types";

type MemoRow = Omit<Memo, "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

function toMemo(row: MemoRow): Memo {
  return {
    ...row,
    images: row.images ?? [],
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export async function listMemos(): Promise<Memo[]> {
  const rows = await query<MemoRow>("SELECT * FROM memos ORDER BY created_at DESC, id DESC");
  return rows.map(toMemo);
}

export async function getMemo(id: number): Promise<Memo | undefined> {
  const rows = await query<MemoRow>("SELECT * FROM memos WHERE id = $1", [id]);
  return rows[0] ? toMemo(rows[0]) : undefined;
}

export async function listMemoFolders(): Promise<string[]> {
  const rows = await query<{ name: string }>("SELECT name FROM memo_folders ORDER BY created_at, name");
  return rows.map((r) => r.name);
}

export async function createMemo(input: {
  content: string;
  folder: string;
  important: boolean;
  images: string[];
}): Promise<Memo> {
  await query("INSERT INTO memo_folders (name) VALUES ($1) ON CONFLICT DO NOTHING", [input.folder]);
  const rows = await query<MemoRow>(
    "INSERT INTO memos (content, folder, important, images) VALUES ($1, $2, $3, $4) RETURNING *",
    [input.content, input.folder, input.important, input.images],
  );
  return toMemo(rows[0]);
}

export async function updateMemo(
  id: number,
  patch: { content?: string; folder?: string; important?: boolean; images?: string[] },
): Promise<Memo | undefined> {
  if (patch.folder !== undefined) {
    await query("INSERT INTO memo_folders (name) VALUES ($1) ON CONFLICT DO NOTHING", [patch.folder]);
  }
  const rows = await query<MemoRow>(
    `UPDATE memos SET
       content = COALESCE($2, content),
       folder = COALESCE($3, folder),
       important = COALESCE($4, important),
       images = COALESCE($5, images),
       updated_at = now()
     WHERE id = $1
     RETURNING *`,
    [id, patch.content ?? null, patch.folder ?? null, patch.important ?? null, patch.images ?? null],
  );
  return rows[0] ? toMemo(rows[0]) : undefined;
}

export async function deleteMemo(id: number): Promise<Memo | undefined> {
  const rows = await query<MemoRow>("DELETE FROM memos WHERE id = $1 RETURNING *", [id]);
  return rows[0] ? toMemo(rows[0]) : undefined;
}

export async function createMemoFolder(name: string): Promise<void> {
  await query("INSERT INTO memo_folders (name) VALUES ($1) ON CONFLICT DO NOTHING", [name]);
}

/** 폴더를 지우면 그 안의 메모는 삭제되지 않고 기본 폴더로 옮긴다. */
export async function deleteMemoFolder(name: string): Promise<void> {
  if (name === DEFAULT_MEMO_FOLDER) return;
  await query("UPDATE memos SET folder = $2 WHERE folder = $1", [name, DEFAULT_MEMO_FOLDER]);
  await query("DELETE FROM memo_folders WHERE name = $1", [name]);
}
