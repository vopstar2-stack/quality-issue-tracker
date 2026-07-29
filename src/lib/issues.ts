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
      (occurred_at, product_name, part_name, manufacturer, location, country, serial_number, quantity, description, status, handler)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
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
      occurred_at = $1,
      product_name = $2,
      part_name = $3,
      manufacturer = $4,
      location = $5,
      country = $6,
      serial_number = $7,
      quantity = $8,
      description = $9,
      status = $10,
      handler = $11,
      updated_at = now()
     WHERE id = $12
     RETURNING *`,
    [
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
