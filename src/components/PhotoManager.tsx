"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { resizeImageFile } from "@/lib/image-resize";
import type { IssuePhoto } from "@/lib/photos";

export default function PhotoManager({
  issueId,
  initialPhotos,
}: {
  issueId: number;
  initialPhotos: IssuePhoto[];
}) {
  const [photos, setPhotos] = useState(initialPhotos);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [viewingPhoto, setViewingPhoto] = useState<IssuePhoto | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      setError("");
      setUploading(true);
      try {
        for (const file of files) {
          const resized = await resizeImageFile(file);
          const formData = new FormData();
          const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
          formData.append("file", resized, `${baseName}.jpg`);

          const res = await fetch(`/api/issues/${issueId}/photos`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error ?? "업로드에 실패했습니다.");
          }
          setPhotos((prev) => [...prev, data.photo]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "업로드 중 오류가 발생했습니다.");
      } finally {
        setUploading(false);
        if (inputRef.current) inputRef.current.value = "";
      }
    },
    [issueId],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        handleFiles(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFiles]);

  useEffect(() => {
    if (!viewingPhoto) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setViewingPhoto(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewingPhoto]);

  async function handleDelete(photoId: number) {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/issues/${issueId}/photos/${photoId}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } else {
      alert("삭제에 실패했습니다.");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative h-28 w-28 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700"
          >
            <button
              type="button"
              onClick={() => setViewingPhoto(photo)}
              className="block h-full w-full cursor-zoom-in"
              aria-label="사진 크게 보기"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="불량 사진" className="h-full w-full object-cover" />
            </button>
            <button
              type="button"
              onClick={() => handleDelete(photo.id)}
              className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
              aria-label="사진 삭제"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-neutral-400 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400"
        >
          {uploading ? "업로드 중..." : "+ 사진 추가"}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files ? Array.from(e.target.files) : [])}
      />
      <p className="text-xs text-neutral-400 dark:text-neutral-500">
        복사한 이미지를 Ctrl+V로 붙여넣어도 추가됩니다.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {viewingPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setViewingPhoto(null)}
        >
          <button
            type="button"
            onClick={() => setViewingPhoto(null)}
            className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1.5 text-sm text-white hover:bg-black/80"
            aria-label="닫기"
          >
            ✕ 닫기
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={viewingPhoto.url}
            alt="불량 사진 크게 보기"
            className="max-h-full max-w-full rounded-md object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
