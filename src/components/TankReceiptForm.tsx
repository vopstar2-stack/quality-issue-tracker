"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import SerialFileInput from "@/components/SerialFileInput";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-neutral-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-neutral-700 dark:text-neutral-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}

export default function TankReceiptForm({ tankReplacementId }: { tankReplacementId: number }) {
  const router = useRouter();
  const [inboundDate, setInboundDate] = useState("");
  const [inboundQuantity, setInboundQuantity] = useState("");
  const [inboundSerial, setInboundSerial] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tank-replacements/${tankReplacementId}/receipts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inbound_date: inboundDate,
          inbound_quantity: inboundQuantity,
          inbound_serial: inboundSerial,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        setSubmitting(false);
        return;
      }
      window.location.href = `/tank-replacements/${tankReplacementId}`;
    } catch (err) {
      console.error(err);
      setError("저장 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="입고일자" required>
          <input
            type="date"
            required
            value={inboundDate}
            onChange={(e) => setInboundDate(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="수량">
          <input
            type="number"
            min={0}
            value={inboundQuantity}
            onChange={(e) => setInboundQuantity(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="SN">
          <input
            value={inboundSerial}
            onChange={(e) => setInboundSerial(e.target.value)}
            className={inputClass}
            placeholder="여러 개면 쉼표로 구분"
          />
          <SerialFileInput onExtract={(serials) => setInboundSerial(serials.join(", "))} />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {submitting ? "저장 중..." : "수령 등록"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
        >
          취소
        </button>
      </div>
    </form>
  );
}
