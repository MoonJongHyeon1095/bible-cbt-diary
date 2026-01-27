import { notFound } from "next/navigation";
import EmotionNoteDetailPage from "@/components/emotion-notes/detail/EmotionNoteDetailPage";
import { Suspense } from "react";

type DetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DetailPage({ params }: DetailPageProps) {
  const { id } = await params;
  const noteId = Number(id);
  if (Number.isNaN(noteId)) {
    notFound();
  }

  return (
    <Suspense fallback={<div />}>
      <EmotionNoteDetailPage noteId={noteId} />
    </Suspense>
  );
}
