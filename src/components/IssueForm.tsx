"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { ISSUE_STATUSES, type Issue, type IssueStatus } from "@/lib/types";

interface FormValues {
  title: string;
  occurred_at: string;
  occurrence_date: string;
  product_name: string;
  part_name: string;
  manufacturer: string;
  location: string;
  country: string;
  serial_number: string;
  quantity: string;
  description: string;
  status: IssueStatus;
}

const emptyValues: FormValues = {
  title: "",
  occurred_at: "",
  occurrence_date: "",
  product_name: "",
  part_name: "",
  manufacturer: "",
  location: "",
  country: "",
  serial_number: "",
  quantity: "",
  description: "",
  status: ISSUE_STATUSES[0],
};

function valuesFromIssue(issue: Issue): FormValues {
  return {
    title: issue.title,
    occurred_at: issue.occurred_at,
    occurrence_date: issue.occurrence_date ?? "",
    product_name: issue.product_name,
    part_name: issue.part_name ?? "",
    manufacturer: issue.manufacturer ?? "",
    location: issue.location ?? "",
    country: issue.country ?? "",
    serial_number: issue.serial_number ?? "",
    quantity: issue.quantity !== null && issue.quantity !== undefined ? String(issue.quantity) : "",
    description: issue.description ?? "",
    status: issue.status,
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

export default function IssueForm({
  mode,
  issue,
}: {
  mode: "create" | "edit";
  issue?: Issue;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(
    issue ? valuesFromIssue(issue) : emptyValues,
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

    const url = mode === "create" ? "/api/issues" : `/api/issues/${issue!.id}`;
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
      // A full navigation (not router.push) so a slow/cold-starting DB on the
      // destination page just shows the browser's own loading state instead
      // of leaving this button stuck on "저장 중..." if the client-side
      // transition stalls.
      window.location.href = `/issues/${data.issue.id}`;
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
          placeholder="예: 초음파 진단기 화면 노이즈 불량"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="접수일자" required>
          <input
            type="date"
            required
            value={values.occurred_at}
            onChange={(e) => update("occurred_at", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="발생일자">
          <input
            type="date"
            value={values.occurrence_date}
            onChange={(e) => update("occurrence_date", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="진행상황" required>
          <select
            value={values.status}
            onChange={(e) => update("status", e.target.value as IssueStatus)}
            className={inputClass}
          >
            {ISSUE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="제품명" required>
          <input
            required
            value={values.product_name}
            onChange={(e) => update("product_name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="부품명">
          <input
            value={values.part_name}
            onChange={(e) => update("part_name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="제조업체">
          <input
            value={values.manufacturer}
            onChange={(e) => update("manufacturer", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="시리얼번호">
          <input
            value={values.serial_number}
            onChange={(e) => update("serial_number", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="발생위치">
          <input
            value={values.location}
            onChange={(e) => update("location", e.target.value)}
            className={inputClass}
            placeholder="예: 서울 A병원 수술실"
          />
        </Field>
        <Field label="발생국가">
          <input
            value={values.country}
            onChange={(e) => update("country", e.target.value)}
            className={inputClass}
            placeholder="예: 대한민국"
          />
        </Field>
        <Field label="수량">
          <input
            type="number"
            min={0}
            value={values.quantity}
            onChange={(e) => update("quantity", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={values.description}
          onChange={(e) => update("description", e.target.value)}
          rows={6}
          className={inputClass}
          placeholder="이슈 상세 내용을 입력하세요."
        />
      </Field>

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
