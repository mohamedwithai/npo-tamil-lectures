import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container max-w-2xl py-16">
      <h1 className="font-tamil text-3xl font-bold">எங்களைப் பற்றி</h1>
      <div className="prose-lecture mt-6">
        <p>
          இந்த அறக்கட்டளை வாரம் மூன்று தமிழ் சொற்பொழிவுகளை வெளியிடுகிறது — அறிவையும்
          ஈமானையும் வளர்ப்பதே எங்கள் நோக்கம்.
        </p>
        <p>
          A non-profit publishing thoughtful Tamil lectures three times a week, with
          Quran references and short quizzes to help readers reflect and retain.
        </p>
      </div>
    </div>
  );
}
