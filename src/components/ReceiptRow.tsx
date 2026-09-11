"use client";

import { useState } from "react";
import type { TankReplacementReceipt } from "@/lib/types";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-2 py-1 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900";

export default function ReceiptRow({
  tankReplacementId,
  receipt,
}: {
  tankReplacementId: number;
  receipt: TankReplacementReceipt;
}) {
  const [editing, setEditing] = useState(false);
  const [date, setDate] = useState(receipt.inbound_date);
  const [quantity, setQuantity] = useState(
    receipt.inbound_quantity !== null && receipt.inbound_quantity !== undefined
      ? String(receipt.inbound_quantity)
      : "",
  );
  const [serial, setSerial] = useState(receipt.inbound_serial ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const basePath = `/api/tank-replacements/${tankReplacementId}/receipts/${receipt.id}`;

  async function handleSave() {
    setSaving(true);
    setError(null);
    const res = await fetch(basePath, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ inbound_date: date, inbound_quantity: quantity, inbound_serial: serial }),
    });
    if (res.ok) {
      window.location.reload();
      return;
    }
    setSaving(false);
    const data = await res.json().catch(() => null);
    setError(data?.error ?? "저장에 실패했습니다.");
  }

  async function handleDelete() {
    if (!window.confirm("이 입고 기록을 삭제할까요?")) return;
    setDeleting(true);
    const res = await fetch(basePath, { method: "DELETE" });
    if (res.ok) {
      window.location.reload();
      return;
    }
    setDeleting(false);
    alert("삭제에 실패했습니다.");
  }

  if (editing) {
    return (
      <tr>
        <td className="py-1.5 pr-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </td>
        <td className="py-1.5 pr-3">
          <input
            type="number"
            min={0}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className={inputClass}
          />
        </td>
        <td className="py-1.5 pr-3">
          <input value={serial} onChange={(e) => setSerial(e.target.value)} className={inputClass} />
        </td>
        <td className="py-1.5 text-right whitespace-nowrap">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="mr-3 text-xs text-blue-600 hover:underline disabled:opacity-50"
          >
            {saving ? "저장 중..." : "저장"}
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-xs text-neutral-500 hover:underline">
            취소
          </button>
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="py-1.5 pr-3">{receipt.inbound_date}</td>
      <td className="py-1.5 pr-3">{receipt.inbound_quantity ?? "-"}</td>
      <td className="py-1.5 pr-3">{receipt.inbound_serial ?? "-"}</td>
      <td className="py-1.5 text-right whitespace-nowrap">
        <button type="button" onClick={() => setEditing(true)} className="mr-3 text-xs text-blue-600 hover:underline">
          수정
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-red-600 hover:underline disabled:opacity-50"
        >
          {deleting ? "삭제 중..." : "삭제"}
        </button>
      </td>
    </tr>
  );
}
