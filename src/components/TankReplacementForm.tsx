"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { TankReplacement } from "@/lib/types";

interface FormValues {
  title: string;
  outbound_date: string;
  outbound_quantity: string;
  outbound_serial: string;
}

const emptyValues: FormValues = {
  title: "누유대체 신품출고",
  outbound_date: "",
  outbound_quantity: "",
  outbound_serial: "",
};

function valuesFromRecord(record: TankReplacement): FormValues {
  return {
    title: record.title,
    outbound_date: record.outbound_date,
    outbound_quantity:
      record.outbound_quantity !== null && record.outbound_quantity !== undefined
        ? String(record.outbound_quantity)
        : "",
    outbound_serial: record.outbound_serial ?? "",
  };
}

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

export default function TankReplacementForm({
  mode,
  record,
}: {
  mode: "create" | "edit";
  record?: TankReplacement;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(
    record ? valuesFromRecord(record) : emptyValues,
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const url = mode === "create" ? "/api/tank-replacements" : `/api/tank-replacements/${record!.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        setSubmitting(false);
        return;
      }
      window.location.href = `/tank-replacements/${data.tankReplacement.id}`;
    } catch (err) {
      console.error(err);
      setError("저장 중 오류가 발생했습니다.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="제목" required>
        <input
          required
          value={values.title}
          onChange={(e) => update("title", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          신품 출고 (포스콤 Tank)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="출고일자" required>
            <input
              type="date"
              required
              value={values.outbound_date}
              onChange={(e) => update("outbound_date", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="수량">
            <input
              type="number"
              min={0}
              value={values.outbound_quantity}
              onChange={(e) => update("outbound_quantity", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="SN">
            <input
              value={values.outbound_serial}
              onChange={(e) => update("outbound_serial", e.target.value)}
              className={inputClass}
              placeholder="여러 개면 쉼표로 구분"
            />
          </Field>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50 dark:bg-white dark:text-neutral-900"
        >
          {submitting ? "저장 중..." : mode === "create" ? "등록" : "저장"}
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
