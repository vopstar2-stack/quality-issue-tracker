import { query } from "./db";
import type { Issue, IssueInput } from "./types";

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

export async function listIssues(): Promise<Issue[]> {
  const rows = await query<IssueRow>(
    "SELECT * FROM issues ORDER BY occurred_at DESC, id DESC",
  );
  return rows.map(toIssue);
}

export async function getIssue(id: number): Promise<Issue | undefined> {
  const rows = await query<IssueRow>("SELECT * FROM issues WHERE id = $1", [id]);
  return rows[0] ? toIssue(rows[0]) : undefined;
}

export async function createIssue(input: IssueInput): Promise<Issue> {
  const rows = await query<IssueRow>(
    `INSERT INTO issues
      (title, occurred_at, product_name, part_name, manufacturer, location, country, serial_number, quantity, description, status, handler)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      input.title,
      input.occurred_at,
      input.product_name,
      input.part_name ?? null,
      input.manufacturer ?? null,
      input.location ?? null,
      input.country ?? null,
      input.serial_number ?? null,
      input.quantity ?? null,
      input.description ?? null,
      input.status,
      input.handler ?? null,
    ],
  );
  return toIssue(rows[0]);
}

export async function updateIssue(id: number, input: IssueInput): Promise<Issue | undefined> {
  const rows = await query<IssueRow>(
    `UPDATE issues SET
      title = $1,
      occurred_at = $2,
      product_name = $3,
      part_name = $4,
      manufacturer = $5,
      location = $6,
      country = $7,
      serial_number = $8,
      quantity = $9,
      description = $10,
      status = $11,
      handler = $12,
      updated_at = now()
     WHERE id = $13
     RETURNING *`,
    [
      input.title,
      input.occurred_at,
      input.product_name,
      input.part_name ?? null,
      input.manufacturer ?? null,
      input.location ?? null,
      input.country ?? null,
      input.serial_number ?? null,
      input.quantity ?? null,
      input.description ?? null,
      input.status,
      input.handler ?? null,
      id,
    ],
  );
  return rows[0] ? toIssue(rows[0]) : undefined;
}

export async function deleteIssue(id: number): Promise<void> {
  await query("DELETE FROM issues WHERE id = $1", [id]);
}
