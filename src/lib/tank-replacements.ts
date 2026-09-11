import { query } from "./db";
import type {
  TankReplacement,
  TankReplacementInput,
  TankReplacementReceipt,
  TankReplacementReceiptInput,
  TankReplacementWithReceipts,
} from "./types";

type TankReplacementRow = Omit<TankReplacement, "created_at" | "updated_at"> & {
  created_at: string | Date;
  updated_at: string | Date;
};

type ReceiptRow = Omit<TankReplacementReceipt, "created_at"> & { created_at: string | Date };

function toTankReplacement(row: TankReplacementRow): TankReplacement {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at,
  };
}

function toReceipt(row: ReceiptRow): TankReplacementReceipt {
  return {
    ...row,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function withReceipts(
  record: TankReplacement,
  receipts: TankReplacementReceipt[],
): TankReplacementWithReceipts {
  const received_quantity = receipts.reduce((sum, r) => sum + (r.inbound_quantity ?? 0), 0);
  // 양수: 아직 못 받은 수량. 음수: 출고수량보다 더 받은 수량(초과입고).
  const remaining_quantity =
    record.outbound_quantity !== null ? record.outbound_quantity - received_quantity : null;

  let status: TankReplacementWithReceipts["status"];
  if (receipts.length === 0) status = "대기";
  else if (remaining_quantity === null) status = "완료";
  else if (remaining_quantity > 0) status = "부분입고";
  else if (remaining_quantity < 0) status = "초과입고";
  else status = "완료";

  return { ...record, receipts, received_quantity, remaining_quantity, status };
}

export async function listTankReplacements(): Promise<TankReplacementWithReceipts[]> {
  const [records, allReceipts] = await Promise.all([
    query<TankReplacementRow>("SELECT * FROM tank_replacements ORDER BY outbound_date DESC, id DESC"),
    query<ReceiptRow>("SELECT * FROM tank_replacement_receipts ORDER BY inbound_date ASC, id ASC"),
  ]);
  const receipts = allReceipts.map(toReceipt);
  return records
    .map(toTankReplacement)
    .map((r) => withReceipts(r, receipts.filter((rec) => rec.tank_replacement_id === r.id)));
}

export async function getTankReplacement(
  id: number,
): Promise<TankReplacementWithReceipts | undefined> {
  const rows = await query<TankReplacementRow>("SELECT * FROM tank_replacements WHERE id = $1", [id]);
  if (!rows[0]) return undefined;
  const receiptRows = await query<ReceiptRow>(
    "SELECT * FROM tank_replacement_receipts WHERE tank_replacement_id = $1 ORDER BY inbound_date ASC, id ASC",
    [id],
  );
  return withReceipts(toTankReplacement(rows[0]), receiptRows.map(toReceipt));
}

export async function createTankReplacement(input: TankReplacementInput): Promise<TankReplacement> {
  const rows = await query<TankReplacementRow>(
    `INSERT INTO tank_replacements (title, outbound_date, outbound_quantity, outbound_serial)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [input.title, input.outbound_date, input.outbound_quantity ?? null, input.outbound_serial ?? null],
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
      updated_at = now()
     WHERE id = $5
     RETURNING *`,
    [input.title, input.outbound_date, input.outbound_quantity ?? null, input.outbound_serial ?? null, id],
  );
  return rows[0] ? toTankReplacement(rows[0]) : undefined;
}

export async function deleteTankReplacement(id: number): Promise<void> {
  await query("DELETE FROM tank_replacements WHERE id = $1", [id]);
}

export async function addTankReplacementReceipt(
  tankReplacementId: number,
  input: TankReplacementReceiptInput,
): Promise<TankReplacementReceipt> {
  const rows = await query<ReceiptRow>(
    `INSERT INTO tank_replacement_receipts (tank_replacement_id, inbound_date, inbound_quantity, inbound_serial)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [tankReplacementId, input.inbound_date, input.inbound_quantity ?? null, input.inbound_serial ?? null],
  );
  return toReceipt(rows[0]);
}

export async function updateTankReplacementReceipt(
  tankReplacementId: number,
  receiptId: number,
  input: TankReplacementReceiptInput,
): Promise<TankReplacementReceipt | undefined> {
  const rows = await query<ReceiptRow>(
    `UPDATE tank_replacement_receipts SET
      inbound_date = $1,
      inbound_quantity = $2,
      inbound_serial = $3
     WHERE id = $4 AND tank_replacement_id = $5
     RETURNING *`,
    [input.inbound_date, input.inbound_quantity ?? null, input.inbound_serial ?? null, receiptId, tankReplacementId],
  );
  return rows[0] ? toReceipt(rows[0]) : undefined;
}

export async function deleteTankReplacementReceipt(
  tankReplacementId: number,
  receiptId: number,
): Promise<void> {
  await query(
    "DELETE FROM tank_replacement_receipts WHERE id = $1 AND tank_replacement_id = $2",
    [receiptId, tankReplacementId],
  );
}
