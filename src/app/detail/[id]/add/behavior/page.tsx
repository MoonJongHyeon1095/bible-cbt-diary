import { notFound } from "next/navigation";
import EmotionNoteAddModePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddModePage";

type BehaviorAddPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function BehaviorAddPage({
  params,
}: BehaviorAddPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return (
    <EmotionNoteAddModePage noteId={noteId} section="behavior" tone="blue" />
  );
}
