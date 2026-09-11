import { query } from "./db";
import type { TankReplacement, TankReplacementInput } from "./types";

type TankReplacementRow = Omit<TankReplacement, "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

function toTankReplacement(row: TankReplacementRow): TankReplacement {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

export async function listTankReplacements(): Promise<TankReplacement[]> {
  const rows = await query<TankReplacementRow>(
    "SELECT * FROM tank_replacements ORDER BY outbound_date DESC, id DESC",
  );
  return rows.map(toTankReplacement);
}

export async function getTankReplacement(id: number): Promise<TankReplacement | undefined> {
  const rows = await query<TankReplacementRow>("SELECT * FROM tank_replacements WHERE id = $1", [id]);
  return rows[0] ? toTankReplacement(rows[0]) : undefined;
}

export async function createTankReplacement(input: TankReplacementInput): Promise<TankReplacement> {
  const rows = await query<TankReplacementRow>(
    `INSERT INTO tank_replacements
      (title, outbound_date, outbound_quantity, outbound_serial, inbound_date, inbound_quantity, inbound_serial)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.title,
      input.outbound_date,
      input.outbound_quantity ?? null,
      input.outbound_serial ?? null,
      input.inbound_date ?? null,
      input.inbound_quantity ?? null,
      input.inbound_serial ?? null,
    ],
  );
  return toTankReplacement(rows[0]);
}

export async function updateTankReplacement(
  id: number,
  input: TankReplacementInput,
): Promise<TankReplacement | undefined> {
  const rows = await query<TankReplacementRow>(
    `UPDATE tank_replacements SET
      title = $1,
      outbound_date = $2,
      outbound_quantity = $3,
      outbound_serial = $4,
      inbound_date = $5,
      inbound_quantity = $6,
      inbound_serial = $7,
      updated_at = now()
     WHERE id = $8
     RETURNING *`,
    [
      input.title,
      input.outbound_date,
      input.outbound_quantity ?? null,
      input.outbound_serial ?? null,
      input.inbound_date ?? null,
      input.inbound_quantity ?? null,
      input.inbound_serial ?? null,
      id,
    ],
  );
  return rows[0] ? toTankReplacement(rows[0]) : undefined;
}

export async function deleteTankReplacement(id: number): Promise<void> {
  await query("DELETE FROM tank_replacements WHERE id = $1", [id]);
}
