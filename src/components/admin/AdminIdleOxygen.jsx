import { useEffect, useRef, useState } from "react";

const IDLE_MS = 60_000;
const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "wheel"];

export default function AdminIdleOxygen() {
  const [idle, setIdle] = useState(false);
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [party, setParty] = useState(false);
  const idleRef = useRef(false);

  useEffect(() => {
    // Handy for previewing the easter egg without waiting a full minute.
    const demo = new URLSearchParams(window.location.search).has("idleDemo");
    let timer;

    function resetTimer() {
      if (idleRef.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        idleRef.current = true;
        setIdle(true);
      }, demo ? 800 : IDLE_MS);
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, resetTimer));
    };
  }, []);

  useEffect(() => {
    if (!idle) return undefined;
    const frame = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [idle]);

  if (!idle) return null;

  function chooseRating(value) {
    setRating(value);
    setParty(true);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Oxygen break"
      className="fixed inset-0 z-[100] overflow-hidden bg-black text-white transition-opacity [transition-duration:1200ms]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <style>{`
        @keyframes gc-oxygen-gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gc-oxygen-pop {
          0% { transform: scale(0.86); opacity: 0; }
          65% { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes gc-oxygen-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-24 opacity-40 blur-[100px]"
        style={{
          background: "linear-gradient(120deg,#ff0080,#7928ca,#00d4ff,#ffcc00,#ff0080)",
          backgroundSize: "300% 300%",
          animation: "gc-oxygen-gradient 8s linear infinite",
        }}
      />

      <button
        type="button"
        onClick={() => window.location.reload()}
        className="absolute right-3 top-3 z-[110] rounded px-1.5 py-1 text-[10px] font-medium leading-none tracking-wide text-white/70 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-[11px]"
        title="Refresh the admin page"
      >
        refresh it to get 1 minute of oxygen
      </button>

      <div className="relative z-[105] mx-auto flex h-full w-full max-w-xl items-center justify-center px-6 py-16">
        <div className="w-full text-center" style={{ animation: "gc-oxygen-pop 700ms ease-out both" }}>
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.32em] text-white/45">
            GoldenCares admin
          </p>
          <h1
            className="mt-4 bg-clip-text font-heading text-[2.8rem] leading-none text-transparent sm:text-[4rem]"
            style={{
              backgroundImage: "linear-gradient(120deg,#ff4d9d,#ffd166,#4dffb8,#4dc4ff,#b46bff,#ff4d9d)",
              backgroundSize: "300% 300%",
              animation: "gc-oxygen-gradient 5s linear infinite, gc-oxygen-float 4s ease-in-out infinite",
              filter: "drop-shadow(0 0 26px rgba(255,77,157,0.35))",
            }}
          >
            Hello Raunak
          </h1>

          <div className="mt-9 rounded-[1.75rem] border border-white/15 bg-white/[0.06] p-5 text-left shadow-2xl backdrop-blur-md sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.92rem] font-semibold text-white/85">Fake comment box</p>
              <span className="text-[0.66rem] uppercase tracking-wider text-white/40">nothing is saved</span>
            </div>

            <div className="mt-4 flex items-center gap-1.5" aria-label="Fake star rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => chooseRating(star)}
                  aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                  aria-pressed={rating === star}
                  className={`text-[2rem] leading-none transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                    star <= rating ? "text-[#ffd166]" : "text-white/25"
                  }`}
                >
                  ★
                </button>
              ))}
              {rating ? <span className="ml-2 text-[0.78rem] text-white/55">{rating}/5</span> : null}
            </div>

            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Write a fake comment…"
              className="mt-4 w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-[0.86rem] text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none"
            />

            <button
              type="button"
              onClick={() => setParty(true)}
              disabled={!rating}
              className="mt-3 w-full rounded-full bg-gradient-to-r from-[#ff4d9d] via-[#ffd166] to-[#4dc4ff] px-5 py-2.5 text-[0.86rem] font-bold text-black transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
            >
              Post fake review
            </button>

            {party ? (
              <p
                className="mt-5 text-center font-heading text-[1.8rem] font-bold sm:text-[2.2rem]"
                style={{
                  backgroundImage: "linear-gradient(90deg,#ff4d9d,#ffd166,#4dffb8,#4dc4ff,#b46bff)",
                  backgroundSize: "300% 300%",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  animation: "gc-oxygen-gradient 4s linear infinite, gc-oxygen-pop 500ms ease-out both",
                }}
              >
                party de do bhai
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
