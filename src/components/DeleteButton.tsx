"use client";

import { useState } from "react";

export default function DeleteButton({ id }: { id: number }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  function openDialog() {
    setCode("");
    setError(null);
    setOpen(true);
  }

  async function handleConfirmDelete() {
    if (!code) return;
    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/issues/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    if (res.ok) {
      // Full navigation, not router.push: avoids leaving the button stuck on
      // "삭제 중..." if the client-side transition stalls on a slow/cold DB.
      window.location.href = "/";
      return;
    }
    setDeleting(false);
    const data = await res.json().catch(() => null);
    if (res.status === 403) {
      setError(data?.error ?? "확인 코드가 올바르지 않습니다.");
    } else {
      setOpen(false);
      alert(data?.error ?? "삭제에 실패했습니다.");
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
      >
        삭제
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-md bg-white p-6 shadow-lg dark:bg-neutral-900">
            <h2 className="mb-2 text-lg font-semibold">이슈 삭제 확인</h2>
            <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
              삭제하려면 확인 코드를 입력하세요.
            </p>
            <input
              autoFocus
              type="password"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code) handleConfirmDelete();
              }}
              className="mb-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-800"
              placeholder="확인 코드"
            />
            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
            <div className={`flex justify-end gap-2 ${error ? "" : "mt-4"}`}>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={deleting}
                className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!code || deleting}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
