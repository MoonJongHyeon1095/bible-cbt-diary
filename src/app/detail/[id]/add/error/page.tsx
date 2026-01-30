import { notFound } from "next/navigation";
import EmotionNoteAddModePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddModePage";

type ErrorAddPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ErrorAddPage({ params }: ErrorAddPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return (
    <EmotionNoteAddModePage noteId={noteId} section="error" tone="rose" />
  );
}
