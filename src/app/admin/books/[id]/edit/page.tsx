import { notFound } from "next/navigation";
import { getBookById } from "@/lib/queries";
import { BookForm, type BookFormData } from "@/components/admin/book-form";

export default async function EditBookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBookById(id);
  if (!book) notFound();

  const initial: BookFormData = {
    id: book.id,
    title: book.title,
    titleEn: book.titleEn ?? "",
    author: book.author ?? "",
    description: book.description ?? "",
    coverImage: book.coverImage ?? "",
    pdfUrl: book.pdfUrl ?? "",
    category: book.category ?? "",
    pages: book.pages != null ? String(book.pages) : "",
    featured: book.featured,
    published: book.published,
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Edit book</h1>
      <BookForm initial={initial} />
    </div>
  );
}
