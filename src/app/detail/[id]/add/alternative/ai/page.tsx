import { notFound } from "next/navigation";
import EmotionNoteAddAlternativePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddAlternativePage";

type AlternativeAddAiPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AlternativeAddAiPage({
  params,
}: AlternativeAddAiPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return <EmotionNoteAddAlternativePage noteId={noteId} mode="ai" />;
}
