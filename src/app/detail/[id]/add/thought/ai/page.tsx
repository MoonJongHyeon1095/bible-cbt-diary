import { notFound } from "next/navigation";
import EmotionNoteAddThoughtPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddThoughtPage";

type ThoughtAddAiPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ThoughtAddAiPage({
  params,
}: ThoughtAddAiPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return <EmotionNoteAddThoughtPage noteId={noteId} mode="ai" />;
}
