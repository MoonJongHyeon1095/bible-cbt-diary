import { notFound } from "next/navigation";
import EmotionNoteAddModePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddModePage";

type AlternativeAddPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AlternativeAddPage({
  params,
}: AlternativeAddPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return (
    <EmotionNoteAddModePage
      noteId={noteId}
      section="alternative"
      tone="green"
    />
  );
}
