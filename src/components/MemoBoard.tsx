"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { resizeImageFile } from "@/lib/image-resize";
import { DEFAULT_MEMO_FOLDER, type Memo } from "@/lib/types";

// 카드/목록 보기 선택을 브라우저에 기억한다(서버 렌더 때는 카드 보기로 시작).
function subscribeView(callback: () => void) {
  window.addEventListener("memoViewChange", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("memoViewChange", callback);
    window.removeEventListener("storage", callback);
  };
}

function readView(): "grid" | "list" {
  try {
    return localStorage.getItem("memoView") === "list" ? "list" : "grid";
  } catch {
    return "grid";
  }
}

type Filter = { type: "all" } | { type: "important" } | { type: "folder"; name: string };
type Editing = { mode: "new"; folder: string; important: boolean } | { mode: "edit"; memo: Memo };
type Photo = { key: string; preview: string; url?: string; file?: File };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "2-digit",
    month: "numeric",
    day: "numeric",
  });
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinejoin="round"
    >
      <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3Z" />
    </svg>
  );
}

const ACCENT = "bg-emerald-600 text-white hover:bg-emerald-700";

export default function MemoBoard({
  initialMemos,
  initialFolders,
}: {
  initialMemos: Memo[];
  initialFolders: string[];
}) {
  const [memos, setMemos] = useState(initialMemos);
  const [folders, setFolders] = useState(initialFolders);
  const [filter, setFilter] = useState<Filter>({ type: "all" });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"created" | "updated">("created");
  const view = useSyncExternalStore(subscribeView, readView, () => "grid" as const);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [addingFolder, setAddingFolder] = useState(false);
  const [newFolder, setNewFolder] = useState("");

  function changeView(next: "grid" | "list") {
    try {
      localStorage.setItem("memoView", next);
    } catch {}
    window.dispatchEvent(new Event("memoViewChange"));
  }

  const counts = useMemo(() => {
    const byFolder: Record<string, number> = {};
    for (const m of memos) byFolder[m.folder] = (byFolder[m.folder] ?? 0) + 1;
    return { all: memos.length, important: memos.filter((m) => m.important).length, byFolder };
  }, [memos]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return memos
      .filter((m) => {
        if (filter.type === "important" && !m.important) return false;
        if (filter.type === "folder" && m.folder !== filter.name) return false;
        return !q || m.content.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const key = sort === "created" ? "created_at" : "updated_at";
        return a[key] < b[key] ? 1 : -1;
      });
  }, [memos, filter, query, sort]);

  function upsert(memo: Memo) {
    setMemos((prev) => (prev.some((m) => m.id === memo.id) ? prev.map((m) => (m.id === memo.id ? memo : m)) : [memo, ...prev]));
    setFolders((prev) => (prev.includes(memo.folder) ? prev : [...prev, memo.folder]));
  }

  async function toggleImportant(memo: Memo) {
    upsert({ ...memo, important: !memo.important });
    const res = await fetch(`/api/memos/${memo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ important: !memo.important }),
    });
    if (!res.ok) upsert(memo);
  }

  async function addFolder() {
    const name = newFolder.trim();
    setNewFolder("");
    setAddingFolder(false);
    if (!name || folders.includes(name)) return;
    const res = await fetch("/api/memo-folders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setFolders((prev) => [...prev, name]);
      setFilter({ type: "folder", name });
    }
  }

  async function removeFolder(name: string) {
    if (!window.confirm(`'${name}' 폴더를 삭제할까요?\n안에 있는 메모는 '${DEFAULT_MEMO_FOLDER}'로 옮겨집니다.`)) return;
    const res = await fetch("/api/memo-folders", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) return;
    setFolders((prev) => prev.filter((f) => f !== name));
    setMemos((prev) => prev.map((m) => (m.folder === name ? { ...m, folder: DEFAULT_MEMO_FOLDER } : m)));
    setFilter((f) => (f.type === "folder" && f.name === name ? { type: "all" } : f));
  }

  function startNew() {
    setEditing({
      mode: "new",
      folder: filter.type === "folder" ? filter.name : DEFAULT_MEMO_FOLDER,
      important: filter.type === "important",
    });
  }

  const isActive = (f: Filter) =>
    f.type === filter.type && (f.type !== "folder" || (filter.type === "folder" && f.name === filter.name));

  const sideItem = (active: boolean) =>
    `flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
      active
        ? "bg-emerald-100 font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200"
        : "text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-900"
    }`;

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-1 text-sm transition ${
      active
        ? "border-emerald-500 font-semibold text-emerald-700 dark:text-emerald-300"
        : "border-neutral-300 text-neutral-600 hover:bg-neutral-100 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-900"
    }`;

  return (
    <div className="@container flex min-h-[calc(100dvh-25px)] w-full">
      <aside className="hidden w-60 shrink-0 flex-col gap-1 border-r border-neutral-200 bg-white p-4 @2xl:flex dark:border-neutral-800 dark:bg-neutral-950">
        <button
          type="button"
          onClick={startNew}
          className={`mb-3 rounded-lg px-4 py-3 text-sm font-semibold shadow-sm ${ACCENT}`}
        >
          메모 쓰기
        </button>

        <button type="button" onClick={() => setFilter({ type: "all" })} className={sideItem(filter.type === "all")}>
          <span>전체</span>
          <span className="text-xs opacity-70">{counts.all}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilter({ type: "important" })}
          className={sideItem(filter.type === "important")}
        >
          <span className="flex items-center gap-1.5">
            <StarIcon filled={false} /> 중요
          </span>
          <span className="text-xs opacity-70">{counts.important}</span>
        </button>

        <div className="mt-3 flex items-center justify-between border-t border-neutral-200 px-3 pt-3 text-xs font-semibold text-neutral-500 dark:border-neutral-800">
          <span>폴더</span>
          <button
            type="button"
            onClick={() => setAddingFolder((v) => !v)}
            className="rounded px-1.5 text-base leading-none hover:bg-neutral-100 dark:hover:bg-neutral-900"
            aria-label="폴더 추가"
            title="폴더 추가"
          >
            +
          </button>
        </div>
        {addingFolder && (
          <input
            autoFocus
            value={newFolder}
            onChange={(e) => setNewFolder(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addFolder();
              if (e.key === "Escape") {
                setAddingFolder(false);
                setNewFolder("");
              }
            }}
            onBlur={addFolder}
            placeholder="폴더 이름 입력 후 Enter"
            className="mx-1 rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm focus:border-emerald-500 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900"
          />
        )}
        {folders.map((name) => (
          <div key={name} className="group relative">
            <button
              type="button"
              onClick={() => setFilter({ type: "folder", name })}
              className={sideItem(filter.type === "folder" && filter.name === name)}
            >
              <span className="truncate">{name}</span>
              <span className="text-xs opacity-70">{counts.byFolder[name] ?? 0}</span>
            </button>
            {name !== DEFAULT_MEMO_FOLDER && (
              <button
                type="button"
                onClick={() => removeFolder(name)}
                className="absolute right-9 top-1/2 hidden -translate-y-1/2 rounded px-1 text-xs text-neutral-400 hover:text-red-600 group-hover:block"
                aria-label={`${name} 폴더 삭제`}
                title="폴더 삭제"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </aside>

      <section className="min-w-0 flex-1 p-4 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2 @2xl:hidden">
          <button type="button" onClick={startNew} className={`rounded-full px-4 py-1.5 text-sm font-semibold ${ACCENT}`}>
            메모 쓰기
          </button>
        </div>

        <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-4 dark:border-neutral-800">
          <div className="flex min-w-0 flex-wrap gap-2 @2xl:hidden">
            <button type="button" onClick={() => setFilter({ type: "all" })} className={chip(filter.type === "all")}>
              전체
            </button>
            <button
              type="button"
              onClick={() => setFilter({ type: "important" })}
              className={chip(filter.type === "important")}
            >
              중요
            </button>
            {folders.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setFilter({ type: "folder", name })}
                className={chip(isActive({ type: "folder", name }))}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as "created" | "updated")}
              className="rounded-md bg-transparent px-2 py-1.5 text-sm text-neutral-700 focus:outline-none dark:text-neutral-300"
              aria-label="정렬"
            >
              <option value="created">생성일 최신순</option>
              <option value="updated">수정일 최신순</option>
            </select>
            {(["grid", "list"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => changeView(v)}
                aria-label={v === "grid" ? "카드로 보기" : "목록으로 보기"}
                title={v === "grid" ? "카드로 보기" : "목록으로 보기"}
                className={`rounded p-1.5 ${view === v ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 hover:text-neutral-700"}`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                  {v === "grid" ? (
                    <>
                      <rect x="4" y="4" width="7" height="7" />
                      <rect x="13" y="4" width="7" height="7" />
                      <rect x="4" y="13" width="7" height="7" />
                      <rect x="13" y="13" width="7" height="7" />
                    </>
                  ) : (
                    <path d="M4 7h16M4 12h16M4 17h16" />
                  )}
                </svg>
              </button>
            ))}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="메모 검색"
              className="w-44 rounded-full bg-neutral-100 px-4 py-1.5 text-sm placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-56 dark:bg-neutral-900"
            />
          </div>
        </div>

        {visible.length === 0 ? (
          <p className="rounded-xl border border-dashed border-neutral-300 p-12 text-center text-sm text-neutral-500 dark:border-neutral-700">
            {memos.length === 0 ? "아직 메모가 없습니다. '메모 쓰기'로 첫 업무일지를 남겨보세요." : "조건에 맞는 메모가 없습니다."}
          </p>
        ) : (
          <div
            className={
              view === "grid"
                ? "grid grid-cols-1 gap-4 @lg:grid-cols-2 @4xl:grid-cols-3 @6xl:grid-cols-4"
                : "flex flex-col gap-3"
            }
          >
            {visible.map((m) => (
              <article
                key={m.id}
                onClick={() => setEditing({ mode: "edit", memo: m })}
                className={`group flex cursor-pointer flex-col rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950 ${
                  view === "grid" ? "h-64" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <p
                    className={`min-w-0 flex-1 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200 ${
                      view === "grid" ? (m.images.length ? "line-clamp-3" : "line-clamp-6") : "line-clamp-3"
                    }`}
                  >
                    {m.content}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleImportant(m);
                    }}
                    aria-label={m.important ? "중요 해제" : "중요 표시"}
                    className={`shrink-0 rounded p-1 ${
                      m.important ? "text-amber-500" : "text-neutral-300 opacity-0 hover:text-amber-500 group-hover:opacity-100"
                    }`}
                  >
                    <StarIcon filled={m.important} />
                  </button>
                </div>
                {m.images.length > 0 && (
                  <div className="mt-2 flex gap-1.5">
                    {m.images.slice(0, 4).map((url, i) => (
                      <div key={url} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100 dark:bg-neutral-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="" loading="lazy" className="h-full w-full object-cover" />
                        {i === 3 && m.images.length > 4 && (
                          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold text-white">
                            +{m.images.length - 3}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-auto border-t border-neutral-100 pt-3 text-xs text-neutral-400 dark:border-neutral-800">
                  {m.folder} ·{formatDate(sort === "created" ? m.created_at : m.updated_at)}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {editing && (
        <Editor
          key={editing.mode === "edit" ? editing.memo.id : "new"}
          editing={editing}
          folders={folders}
          onClose={() => setEditing(null)}
          onSaved={(memo) => {
            upsert(memo);
            setEditing(null);
          }}
          onDeleted={(id) => {
            setMemos((prev) => prev.filter((m) => m.id !== id));
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function Editor({
  editing,
  folders,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: Editing;
  folders: string[];
  onClose: () => void;
  onSaved: (memo: Memo) => void;
  onDeleted: (id: number) => void;
}) {
  const existing = editing.mode === "edit" ? editing.memo : null;
  const [content, setContent] = useState(existing?.content ?? "");
  const [folder, setFolder] = useState(existing?.folder ?? (editing.mode === "new" ? editing.folder : DEFAULT_MEMO_FOLDER));
  const [important, setImportant] = useState(existing?.important ?? (editing.mode === "new" ? editing.important : false));
  // 이미 저장된 사진(url)과, 저장 누를 때 올릴 새 사진(file)을 한 목록으로 다룬다.
  const [photos, setPhotos] = useState<Photo[]>(() =>
    (existing?.images ?? []).map((url) => ({ key: url, preview: url, url })),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photosRef = useRef(photos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    // 창을 닫을 때 새 사진 미리보기 주소를 정리한다.
    return () => photosRef.current.forEach((p) => p.file && URL.revokeObjectURL(p.preview));
  }, []);

  async function addFiles(files: File[]) {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (images.length === 0) return;
    setError(null);
    try {
      // 저장 공간을 아끼려고 작고 낮은 화질로 줄인다.
      const added = await Promise.all(
        images.map(async (file): Promise<Photo> => {
          const blob = await resizeImageFile(file, 1024, 0.6);
          const base = file.name.replace(/\.[^.]+$/, "") || "photo";
          const resized = new File([blob], `${base}.jpg`, { type: "image/jpeg" });
          const preview = URL.createObjectURL(blob);
          return { key: preview, preview, file: resized };
        }),
      );
      setPhotos((prev) => [...prev, ...added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "사진을 처리하지 못했습니다.");
    }
  }

  function removePhoto(key: string) {
    setPhotos((prev) => {
      const target = prev.find((p) => p.key === key);
      if (target?.file) URL.revokeObjectURL(target.preview);
      return prev.filter((p) => p.key !== key);
    });
  }

  async function uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file, file.name);
    const res = await fetch("/api/memos/images", { method: "POST", body: formData });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.url) throw new Error(data?.error ?? "사진 업로드에 실패했습니다.");
    return data.url;
  }

  async function save() {
    if (!content.trim() && photos.length === 0) {
      setError("내용을 입력하거나 사진을 넣어주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const images = await Promise.all(photos.map((p) => (p.url ? p.url : uploadPhoto(p.file!))));
      const res = await fetch(existing ? `/api/memos/${existing.id}` : "/api/memos", {
        method: existing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, folder, important, images }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "저장에 실패했습니다.");
      onSaved(data.memo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing || !window.confirm("이 메모를 삭제할까요?")) return;
    setSaving(true);
    const res = await fetch(`/api/memos/${existing.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(existing.id);
    else {
      setSaving(false);
      setError("삭제에 실패했습니다.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
      }}
    >
      <div className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-2xl bg-white p-5 shadow-xl dark:bg-neutral-900">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPaste={(e) => {
            const files = Array.from(e.clipboardData.items)
              .filter((it) => it.kind === "file" && it.type.startsWith("image/"))
              .map((it) => it.getAsFile())
              .filter((f): f is File => f !== null);
            if (files.length > 0) {
              e.preventDefault();
              addFiles(files);
            }
          }}
          placeholder="오늘 한 일, 메모할 내용을 자유롭게 적으세요. (사진은 Ctrl+V로 붙여넣거나 아래 '사진' 버튼)"
          className={`w-full flex-1 resize-none bg-transparent text-[15px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 focus:outline-none dark:text-neutral-100 ${
            photos.length ? "min-h-[30dvh]" : "min-h-[50dvh]"
          }`}
        />
        {photos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p) => (
              <div
                key={p.key}
                className="group/photo relative h-20 w-20 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
              >
                <a href={p.preview} target="_blank" rel="noopener noreferrer" title="크게 보기">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.preview} alt="첨부 사진" className="h-full w-full object-cover" />
                </a>
                <button
                  type="button"
                  onClick={() => removePhoto(p.key)}
                  className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 text-xs leading-5 text-white sm:opacity-0 sm:group-hover/photo:opacity-100"
                  aria-label="사진 삭제"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3 dark:border-neutral-800">
          <select
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900"
            aria-label="폴더"
          >
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setImportant((v) => !v)}
            className={`flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-sm ${
              important
                ? "border-amber-400 text-amber-600"
                : "border-neutral-300 text-neutral-500 dark:border-neutral-700"
            }`}
          >
            <StarIcon filled={important} /> 중요
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 rounded-md border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <circle cx="9" cy="11" r="1.5" />
              <path d="m21 16-5-5-7 7" />
            </svg>
            사진{photos.length > 0 ? ` ${photos.length}` : ""}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addFiles(Array.from(e.target.files ?? []));
              e.target.value = "";
            }}
          />
          <span className="hidden text-xs text-neutral-400 sm:inline">Ctrl+Enter 저장 · Esc 닫기</span>
          <div className="ml-auto flex gap-2">
            {existing && (
              <button
                type="button"
                onClick={remove}
                disabled={saving}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:hover:bg-red-950"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800"
            >
              취소
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className={`rounded-md px-4 py-1.5 text-sm font-semibold disabled:opacity-50 ${ACCENT}`}
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
