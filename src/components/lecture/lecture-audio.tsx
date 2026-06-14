"use client";

import * as React from "react";
import { Play, Pause, Square, Volume2, X, Gauge } from "lucide-react";

/**
 * Read-aloud (text-to-speech) for a lecture, using the browser's free Web
 * Speech API (no backend, no paid TTS). Reads the VISIBLE text passed in, so it
 * automatically respects the 30% gate (guests get only the preview text).
 *
 * Renders:
 *  - a dismissible intro popup offering to listen (shown once per lecture), and
 *  - a floating player bar with play/pause/stop + speed control.
 *
 * Tamil playback quality depends on the device having a Tamil (ta-*) voice;
 * we pick one when available and otherwise fall back to the default voice.
 */

type Status = "idle" | "playing" | "paused";

// Split into speakable chunks (sentence-ish), capped in length — some browsers
// silently drop very long utterances.
function chunkText(text: string): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?।…])\s+/);
  const chunks: string[] = [];
  let buf = "";
  for (const s of sentences) {
    if ((buf + " " + s).trim().length > 220) {
      if (buf) chunks.push(buf.trim());
      buf = s;
    } else {
      buf = (buf + " " + s).trim();
    }
  }
  if (buf) chunks.push(buf.trim());
  return chunks;
}

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;

export function LectureAudio({
  lectureId,
  text,
}: {
  lectureId: string;
  text: string;
}) {
  const [supported, setSupported] = React.useState(false);
  const [status, setStatus] = React.useState<Status>("idle");
  const [showPopup, setShowPopup] = React.useState(false);
  const [rate, setRate] = React.useState(1);
  const [progress, setProgress] = React.useState(0); // 0..100

  const chunks = React.useMemo(() => chunkText(text), [text]);
  const indexRef = React.useRef(0);
  const rateRef = React.useRef(rate);
  rateRef.current = rate;
  const voiceRef = React.useRef<SpeechSynthesisVoice | null>(null);

  // Detect support + pick a Tamil voice (voices may load asynchronously).
  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);

    const pickVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      voiceRef.current =
        voices.find((v) => v.lang?.toLowerCase().startsWith("ta")) ??
        voices.find((v) => v.lang?.toLowerCase().startsWith("hi")) ??
        null;
    };
    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Offer the intro popup once per lecture (unless dismissed before).
  React.useEffect(() => {
    if (!supported || chunks.length === 0) return;
    const key = `audio-popup-dismissed:${lectureId}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => setShowPopup(true), 1200);
    return () => clearTimeout(t);
  }, [supported, chunks.length, lectureId]);

  const speakFrom = React.useCallback(
    (start: number) => {
      const synth = window.speechSynthesis;
      synth.cancel();
      indexRef.current = start;

      const speakNext = () => {
        const i = indexRef.current;
        if (i >= chunks.length) {
          setStatus("idle");
          setProgress(100);
          return;
        }
        const u = new SpeechSynthesisUtterance(chunks[i]);
        u.lang = voiceRef.current?.lang ?? "ta-IN";
        if (voiceRef.current) u.voice = voiceRef.current;
        u.rate = rateRef.current;
        u.onend = () => {
          indexRef.current += 1;
          setProgress(Math.round((indexRef.current / chunks.length) * 100));
          if (window.speechSynthesis.speaking || indexRef.current <= chunks.length)
            speakNext();
        };
        u.onerror = () => {
          setStatus("idle");
        };
        synth.speak(u);
      };

      setStatus("playing");
      speakNext();
    },
    [chunks]
  );

  const handlePlay = React.useCallback(() => {
    setShowPopup(false);
    if (status === "paused") {
      window.speechSynthesis.resume();
      setStatus("playing");
      return;
    }
    speakFrom(status === "idle" && progress >= 100 ? 0 : indexRef.current);
  }, [status, progress, speakFrom]);

  const handlePause = React.useCallback(() => {
    window.speechSynthesis.pause();
    setStatus("paused");
  }, []);

  const handleStop = React.useCallback(() => {
    window.speechSynthesis.cancel();
    indexRef.current = 0;
    setProgress(0);
    setStatus("idle");
  }, []);

  const cycleSpeed = React.useCallback(() => {
    const next = SPEEDS[(SPEEDS.indexOf(rate as never) + 1) % SPEEDS.length];
    setRate(next);
    // Apply immediately by restarting from the current chunk if playing.
    if (status === "playing") {
      rateRef.current = next;
      speakFrom(indexRef.current);
    }
  }, [rate, status, speakFrom]);

  const dismissPopup = React.useCallback(() => {
    setShowPopup(false);
    localStorage.setItem(`audio-popup-dismissed:${lectureId}`, "1");
  }, [lectureId]);

  if (!supported || chunks.length === 0) return null;

  return (
    <>
      {/* Intro popup */}
      {showPopup && (
        <div className="fixed inset-x-0 bottom-24 z-50 mx-auto w-[92%] max-w-sm rounded-2xl border bg-background p-4 shadow-xl sm:bottom-28">
          <button
            onClick={dismissPopup}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-primary/10 p-2 text-primary">
              <Volume2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-tamil text-sm font-semibold">
                இந்தச் சொற்பொழிவைக் கேட்க விரும்புகிறீர்களா?
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Listen to this lecture read aloud.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={handlePlay}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="h-3.5 w-3.5" /> கேளுங்கள்
                </button>
                <button
                  onClick={dismissPopup}
                  className="rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
                >
                  பின்னர்
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating player bar */}
      <div className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-[92%] max-w-md items-center gap-3 rounded-full border bg-background/95 px-3 py-2 shadow-lg backdrop-blur">
        {status === "playing" ? (
          <button
            onClick={handlePause}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Pause"
          >
            <Pause className="h-5 w-5" />
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label={status === "paused" ? "Resume" : "Listen"}
          >
            <Play className="h-5 w-5" />
          </button>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Volume2 className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="font-tamil">கேளுங்கள் (Listen)</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <button
          onClick={cycleSpeed}
          className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium hover:bg-muted"
          aria-label="Playback speed"
          title="Playback speed"
        >
          <Gauge className="h-3.5 w-3.5" /> {rate}×
        </button>

        {status !== "idle" && (
          <button
            onClick={handleStop}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border hover:bg-muted"
            aria-label="Stop"
          >
            <Square className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}
