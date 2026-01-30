import { notFound } from "next/navigation";
import EmotionNoteAddThoughtPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddThoughtPage";

type ThoughtAddDirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ThoughtAddDirectPage({
  params,
}: ThoughtAddDirectPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return <EmotionNoteAddThoughtPage noteId={noteId} mode="direct" />;
}
