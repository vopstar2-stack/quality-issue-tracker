import type { TankReplacementInput } from "./types";

export function parseTankReplacementInput(
  body: unknown,
): TankReplacementInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "잘못된 요청 본문입니다." };
  }
  const b = body as Record<string, unknown>;

  const title = typeof b.title === "string" && b.title.trim() ? b.title.trim() : "누유대체 신품출고";
  const outbound_date = typeof b.outbound_date === "string" ? b.outbound_date : "";
  if (!outbound_date) return { error: "출고일자는 필수입니다." };

  const asString = (v: unknown) => (typeof v === "string" && v.trim() !== "" ? v.trim() : null);

  const asQuantity = (v: unknown, label: string): number | null | { error: string } => {
    if (v === undefined || v === null || v === "") return null;
    const n = Number(v);
    if (Number.isNaN(n)) return { error: `${label}은 숫자여야 합니다.` };
    return n;
  };

  const outbound_quantity = asQuantity(b.outbound_quantity, "출고 수량");
  if (outbound_quantity !== null && typeof outbound_quantity === "object") return outbound_quantity;
  const inbound_quantity = asQuantity(b.inbound_quantity, "입고 수량");
  if (inbound_quantity !== null && typeof inbound_quantity === "object") return inbound_quantity;

  return {
    title,
    outbound_date,
    outbound_quantity,
    outbound_serial: asString(b.outbound_serial),
    inbound_date: asString(b.inbound_date),
    inbound_quantity,
    inbound_serial: asString(b.inbound_serial),
  };
}
