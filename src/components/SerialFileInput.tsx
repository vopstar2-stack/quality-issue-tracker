"use client";

import { useRef, useState, type ChangeEvent } from "react";

export default function SerialFileInput({ onExtract }: { onExtract: (serials: string[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setCount(null);
    setLoading(true);
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false });

      // 시트 전체 셀 값 중 숫자가 하나라도 포함된 값만 시리얼번호로 본다.
      // "시리얼번호" 같은 제목 행(숫자 없음)은 자연스럽게 걸러진다.
      const serials = rows
        .flat()
        .map((v) => (v === null || v === undefined ? "" : String(v).trim()))
        .filter((v) => v !== "" && /\d/.test(v));

      if (serials.length === 0) {
        setError("엑셀에서 시리얼번호로 보이는 값을 찾지 못했습니다.");
        return;
      }
      onExtract(serials);
      setCount(serials.length);
    } catch (err) {
      console.error(err);
      setError("엑셀 파일을 읽는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="self-start rounded-md border border-neutral-300 px-2 py-1 text-xs font-medium hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:hover:bg-neutral-800"
      >
        {loading ? "읽는 중..." : "엑셀에서 불러오기"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleChange}
      />
      {count !== null && <p className="text-xs text-neutral-500 dark:text-neutral-400">{count}개 불러옴</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
