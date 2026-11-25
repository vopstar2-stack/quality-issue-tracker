import { del } from "@vercel/blob";

/** 요청 본문의 images 값을 검증한다. 없으면 undefined(=건드리지 않음), 잘못됐으면 빈 배열이 아니라 undefined. */
export function parseImageUrls(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((v): v is string => typeof v === "string" && v.startsWith("https://"));
}

/** Blob에서 사진을 지운다. 실패해도 메모 처리는 계속되도록 조용히 넘긴다. */
export async function deleteImages(urls: string[]): Promise<void> {
  await Promise.all(urls.map((url) => del(url).catch(() => {})));
}
