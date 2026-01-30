import { notFound } from "next/navigation";
import EmotionNoteAddAlternativePage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddAlternativePage";

type AlternativeAddDirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AlternativeAddDirectPage({
  params,
}: AlternativeAddDirectPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return <EmotionNoteAddAlternativePage noteId={noteId} mode="direct" />;
}
