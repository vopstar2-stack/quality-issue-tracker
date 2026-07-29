import { ISSUE_STATUSES, type IssueInput } from "./types";

export function parseIssueInput(body: unknown): IssueInput | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "잘못된 요청 본문입니다." };
  }
  const b = body as Record<string, unknown>;

  const occurred_at = typeof b.occurred_at === "string" ? b.occurred_at : "";
  const product_name = typeof b.product_name === "string" ? b.product_name.trim() : "";
  const status = typeof b.status === "string" ? b.status : "";

  if (!occurred_at) return { error: "발생일자는 필수입니다." };
  if (!product_name) return { error: "제품명은 필수입니다." };
  if (!ISSUE_STATUSES.includes(status as (typeof ISSUE_STATUSES)[number])) {
    return { error: "진행상황 값이 올바르지 않습니다." };
  }

  const quantityRaw = b.quantity;
  let quantity: number | null = null;
  if (quantityRaw !== undefined && quantityRaw !== null && quantityRaw !== "") {
    const n = Number(quantityRaw);
    if (Number.isNaN(n)) return { error: "수량은 숫자여야 합니다." };
    quantity = n;
  }

  const asString = (v: unknown) =>
    typeof v === "string" && v.trim() !== "" ? v.trim() : null;

  return {
    occurred_at,
    product_name,
    part_name: asString(b.part_name),
    manufacturer: asString(b.manufacturer),
    location: asString(b.location),
    country: asString(b.country),
    serial_number: asString(b.serial_number),
    quantity,
    description: asString(b.description),
    status: status as IssueInput["status"],
    handler: asString(b.handler),
  };
}
