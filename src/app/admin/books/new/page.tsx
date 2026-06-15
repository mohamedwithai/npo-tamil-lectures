import { BookForm, type BookFormData } from "@/components/admin/book-form";

const empty: BookFormData = {
  title: "",
  titleEn: "",
  author: "",
  description: "",
  coverImage: "",
  pdfUrl: "",
  category: "",
  pages: "",
  featured: false,
  published: true,
};

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">New book</h1>
      <BookForm initial={empty} />
    </div>
  );
}
