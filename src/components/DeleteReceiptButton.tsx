"use client";

import { useState } from "react";

export default function DeleteReceiptButton({
  tankReplacementId,
  receiptId,
}: {
  tankReplacementId: number;
  receiptId: number;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("이 입고 기록을 삭제할까요?")) return;
    setDeleting(true);
    const res = await fetch(`/api/tank-replacements/${tankReplacementId}/receipts/${receiptId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      window.location.reload();
      return;
    }
    setDeleting(false);
    alert("삭제에 실패했습니다.");
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="text-xs text-red-600 hover:underline disabled:opacity-50"
    >
      {deleting ? "삭제 중..." : "삭제"}
    </button>
  );
}
