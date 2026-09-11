"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import type { TankReplacement } from "@/lib/types";

interface FormValues {
  title: string;
  outbound_date: string;
  outbound_quantity: string;
  outbound_serial: string;
  inbound_date: string;
  inbound_quantity: string;
  inbound_serial: string;
}

const emptyValues: FormValues = {
  title: "누유대체 신품출고",
  outbound_date: "",
  outbound_quantity: "",
  outbound_serial: "",
  inbound_date: "",
  inbound_quantity: "",
  inbound_serial: "",
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
    inbound_date: record.inbound_date ?? "",
    inbound_quantity:
      record.inbound_quantity !== null && record.inbound_quantity !== undefined
        ? String(record.inbound_quantity)
        : "",
    inbound_serial: record.inbound_serial ?? "",
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
  section = "full",
}: {
  mode: "create" | "edit";
  record?: TankReplacement;
  /** "outbound": 신품출고 등록(제목+출고 정보만). "inbound": 대체품 수령 등록(출고 정보는
   * 참고용으로만 보여주고 입고 정보만 입력). "full": 기존 기록 수정(전체 편집). */
  section?: "full" | "outbound" | "inbound";
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

  const showOutboundInputs = section === "full" || section === "outbound";
  const showInboundInputs = section === "full" || section === "inbound";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Field label="제목" required>
        {section === "inbound" ? (
          <p className={`${inputClass} bg-neutral-50 dark:bg-neutral-950`}>{values.title}</p>
        ) : (
          <input
            required
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
          />
        )}
      </Field>

      <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
          신품 출고 (포스콤 Tank)
        </h2>
        {showOutboundInputs ? (
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
        ) : (
          <div className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
            <p><span className="text-neutral-500">출고일자</span> {values.outbound_date}</p>
            <p><span className="text-neutral-500">수량</span> {values.outbound_quantity || "-"}</p>
            <p><span className="text-neutral-500">SN</span> {values.outbound_serial || "-"}</p>
          </div>
        )}
      </div>

      {showInboundInputs && (
        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-800">
          <h2 className="mb-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            대체품 입고 (포스콤에서 받는 Tank)
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="입고일자" required={section === "inbound"}>
              <input
                type="date"
                required={section === "inbound"}
                value={values.inbound_date}
                onChange={(e) => update("inbound_date", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="수량">
              <input
                type="number"
                min={0}
                value={values.inbound_quantity}
                onChange={(e) => update("inbound_quantity", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="SN">
              <input
                value={values.inbound_serial}
                onChange={(e) => update("inbound_serial", e.target.value)}
                className={inputClass}
                placeholder="여러 개면 쉼표로 구분"
              />
            </Field>
          </div>
          {section === "full" && (
            <p className="mt-2 text-xs text-neutral-400 dark:text-neutral-500">
              아직 대체품을 못 받았으면 비워두고 나중에 다시 열어서 채우면 됩니다.
            </p>
          )}
        </div>
      )}

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
