import { notFound } from "next/navigation";
import EmotionNoteAddErrorPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddErrorPage";

type ErrorAddAiPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ErrorAddAiPage({ params }: ErrorAddAiPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return <EmotionNoteAddErrorPage noteId={noteId} mode="ai" />;
}
