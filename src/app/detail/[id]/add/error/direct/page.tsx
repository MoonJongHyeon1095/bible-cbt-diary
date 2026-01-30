import { notFound } from "next/navigation";
import EmotionNoteAddErrorPage from "@/components/emotion-notes/detail/add/pages/EmotionNoteAddErrorPage";

type ErrorAddDirectPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ErrorAddDirectPage({
  params,
}: ErrorAddDirectPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return <EmotionNoteAddErrorPage noteId={noteId} mode="direct" />;
}
