import { query } from "./db";
import type { Issue, IssueFilters, IssueInput, IssueWithSeq } from "./types";

type IssueRow = Omit<Issue, "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

function toIssue(row: IssueRow): Issue {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export async function listIssues(filters: IssueFilters = {}): Promise<IssueWithSeq[]> {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(filters.status);
  }
  if (filters.manufacturer) {
    conditions.push(`manufacturer = $${paramIndex++}`);
    params.push(filters.manufacturer);
  }
  if (filters.country) {
    conditions.push(`country = $${paramIndex++}`);
    params.push(filters.country);
  }
  if (filters.q) {
    const p = paramIndex++;
    conditions.push(`(
      title ILIKE $${p} OR
      product_name ILIKE $${p} OR
      part_name ILIKE $${p} OR
      manufacturer ILIKE $${p} OR
      serial_number ILIKE $${p} OR
      description ILIKE $${p} OR
      location ILIKE $${p}
    )`);
    params.push(`%${filters.q}%`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  // seq_num is computed over ALL issues (in the "ranked" CTE, before the WHERE
  // filter below is applied) so it always reflects true registration order —
  // the same issue keeps the same number no matter what search/filter is active.
  const rows = await query<IssueRow & { seq_num: string | number }>(
    `WITH ranked AS (
       SELECT *, ROW_NUMBER() OVER (ORDER BY id ASC) AS seq_num FROM issues
     )
     SELECT * FROM ranked
     ${where}
     ORDER BY id DESC`,
    params,
  );
  return rows.map((row) => ({ ...toIssue(row), seq_num: Number(row.seq_num) }));
}

export async function listDistinctValues(
  column: "manufacturer" | "country",
): Promise<string[]> {
  const rows = await query<{ value: string }>(
    `SELECT DISTINCT ${column} AS value FROM issues WHERE ${column} IS NOT NULL AND ${column} <> '' ORDER BY value`,
  );
  return rows.map((row) => row.value);
}

export async function getIssue(id: number): Promise<Issue | undefined> {
  const rows = await query<IssueRow>("SELECT * FROM issues WHERE id = $1", [id]);
  return rows[0] ? toIssue(rows[0]) : undefined;
}

export async function createIssue(input: IssueInput): Promise<Issue> {
  const rows = await query<IssueRow>(
    `INSERT INTO issues
      (title, occurred_at, occurrence_date, product_name, part_name, manufacturer, location, country, serial_number, quantity, description, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      input.title,
      input.occurred_at,
      input.occurrence_date ?? null,
      input.product_name,
      input.part_name ?? null,
      input.manufacturer ?? null,
      input.location ?? null,
      input.country ?? null,
      input.serial_number ?? null,
      input.quantity ?? null,
      input.description ?? null,
      input.status,
    ],
  );
  return toIssue(rows[0]);
}

export async function updateIssue(id: number, input: IssueInput): Promise<Issue | undefined> {
  const rows = await query<IssueRow>(
    `UPDATE issues SET
      title = $1,
      occurred_at = $2,
      occurrence_date = $3,
      product_name = $4,
      part_name = $5,
      manufacturer = $6,
      location = $7,
      country = $8,
      serial_number = $9,
      quantity = $10,
      description = $11,
      status = $12,
      updated_at = now()
     WHERE id = $13
     RETURNING *`,
    [
      input.title,
      input.occurred_at,
      input.occurrence_date ?? null,
      input.product_name,
      input.part_name ?? null,
      input.manufacturer ?? null,
      input.location ?? null,
      input.country ?? null,
      input.serial_number ?? null,
      input.quantity ?? null,
      input.description ?? null,
      input.status,
      id,
    ],
  );
  return rows[0] ? toIssue(rows[0]) : undefined;
}

export async function deleteIssue(id: number): Promise<void> {
  await query("DELETE FROM issues WHERE id = $1", [id]);
}
