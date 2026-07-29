"use client";

import { useRef, useState } from "react";
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
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
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
  }

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="불량 사진" className="h-full w-full object-cover" />
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
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
