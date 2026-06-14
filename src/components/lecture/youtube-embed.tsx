import { youtubeId } from "@/lib/utils";

/** Lazy YouTube iframe (native lazy-loading) for the lecture's video. */
export function YouTubeEmbed({ url }: { url: string }) {
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <div className="my-8 aspect-video overflow-hidden rounded-xl border bg-black">
      <iframe
        className="h-full w-full"
        src={`https://www.youtube-nocookie.com/embed/${id}`}
        title="Lecture video"
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  );
}
