import { notFound } from "next/navigation";
import EmotionNoteAddBehaviorPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddBehaviorPage";

type BehaviorAddDirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BehaviorAddDirectPage({
  params,
}: BehaviorAddDirectPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return <EmotionNoteAddBehaviorPage noteId={noteId} mode="direct" />;
}
