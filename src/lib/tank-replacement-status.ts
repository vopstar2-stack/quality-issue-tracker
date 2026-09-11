import type { TankReplacementStatus, TankReplacementWithReceipts } from "./types";

export const STATUS_STYLE: Record<TankReplacementStatus, string> = {
  대기: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  부분입고: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  완료: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200",
  초과입고: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200",
};

export function statusLabel(
  record: Pick<TankReplacementWithReceipts, "status" | "remaining_quantity">,
): string {
  if (record.status === "부분입고" && record.remaining_quantity !== null) {
    return `${record.remaining_quantity}개 미입고`;
  }
  if (record.status === "초과입고" && record.remaining_quantity !== null) {
    return `${Math.abs(record.remaining_quantity)}개 초과입고`;
  }
  if (record.status === "완료") return "입고완료";
  return "입고대기";
}

/** 수령 등록 액션을 보여줄지 여부. 완료/초과입고는 더 채울 게 없어 숨긴다. */
export function needsReceiptAction(status: TankReplacementStatus): boolean {
  return status === "대기" || status === "부분입고";
}
