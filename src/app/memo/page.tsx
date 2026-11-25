import MemoBoard from "@/components/MemoBoard";
import { listMemoFolders, listMemos } from "@/lib/memos";

export const dynamic = "force-dynamic";

export default async function MemoPage() {
  const [memos, folders] = await Promise.all([listMemos(), listMemoFolders()]);
  return <MemoBoard initialMemos={memos} initialFolders={folders} />;
}
