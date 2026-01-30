import { notFound } from "next/navigation";
import EmotionNoteAddModePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddModePage";

type ThoughtAddPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ThoughtAddPage({ params }: ThoughtAddPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return (
    <EmotionNoteAddModePage noteId={noteId} section="thought" tone="amber" />
  );
}
