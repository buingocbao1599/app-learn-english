import { useEffect, useRef, useState } from "react";
import type { Word } from "../types";
import { grade } from "../progress";
import { pickSession, shuffle, useSession } from "../session";
import { speak } from "../speak";
import { SpeakButton } from "./SpeakButton";
import { Bar, Done, Empty } from "./Done";

export type QuizMode = "en-vi" | "vi-en" | "listen";

type Question = { word: Word; options: Word[] };

function buildQuestions(words: Word[], pool: Word[], size: number, mode: QuizMode): Question[] {
  const key = (w: Word) => (mode === "en-vi" ? w.vi : w.w).toLowerCase();
  return pickSession(words, size).map((word) => {
    // prefer distractors with the same part of speech so the answer isn't obvious
    const others = shuffle(pool.filter((w) => w.id !== word.id && key(w) !== key(word)));
    const same = others.filter((w) => w.p === word.p);
    const picked: Word[] = [];
    const seen = new Set([key(word)]);
    for (const w of [...same, ...others]) {
      if (picked.length === 3) break;
      if (seen.has(key(w))) continue;
      seen.add(key(w));
      picked.push(w);
    }
    return { word, options: shuffle([word, ...picked]) };
  });
}

export function Quiz({ words, pool, mode, size = 10 }: { words: Word[]; pool: Word[]; mode: QuizMode; size?: number }) {
  const [qs, restart] = useSession(() => buildQuestions(words, pool, size, mode), [words, pool, size, mode]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState<Word[]>([]);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setI(0);
    setScore(0);
    setPicked(null);
    setMissed([]);
  }, [qs]);

  const q = qs?.[i];

  useEffect(() => {
    if (q && mode === "listen") speak(q.word.w);
  }, [q, mode]);

  const choose = (opt: Word) => {
    if (!q || picked) return;
    const ok = opt.id === q.word.id;
    setPicked(opt.id);
    grade(q.word.id, ok);
    if (ok) setScore((s) => s + 1);
    else setMissed((m) => [...m, q.word]);
    if (mode !== "listen") speak(q.word.w);
    setTimeout(() => nextRef.current?.focus(), 0);
  };

  const next = () => {
    setPicked(null);
    setI((n) => n + 1);
  };

  useEffect(() => {
    if (!q) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      const n = Number(e.key);
      if (!picked && n >= 1 && n <= q.options.length) choose(q.options[n - 1]);
      else if (picked && e.key === "Enter" && document.activeElement !== nextRef.current) next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!qs) return <Empty>Đang tạo câu hỏi…</Empty>;
  if (qs.length === 0 || pool.length < 2) return <Empty>Cần ít nhất 2 từ để làm trắc nghiệm.</Empty>;
  if (!q)
    return (
      <Done correct={score} total={qs.length} onRestart={restart}>
        {missed.length > 0 && (
          <div className="v-missed">
            <h3>Từ cần ôn lại</h3>
            <ul>
              {missed.map((w) => (
                <li key={w.id}>
                  <SpeakButton text={w.w} /> <b>{w.w}</b> <span className="v-ipa">{w.ipa}</span> — {w.vi}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Done>
    );

  const label = (w: Word) => (mode === "en-vi" ? w.vi : w.w);

  return (
    <div className="v-practice">
      <div className="v-practice__top">
        <span className="v-muted">
          Câu {i + 1}/{qs.length}
        </span>
        <span className="v-muted">Đúng: {score}</span>
      </div>
      <Bar value={i} total={qs.length} />
      <div className="v-question">
        {mode === "en-vi" && (
          <>
            <div className="v-question__prompt">
              {q.word.w} <SpeakButton text={q.word.w} />
            </div>
            <div className="v-card__meta">
              <span className="v-pos">{q.word.p}</span> <span className="v-ipa">{q.word.ipa}</span>
            </div>
            <p className="v-muted">Chọn nghĩa tiếng Việt đúng</p>
          </>
        )}
        {mode === "vi-en" && (
          <>
            <div className="v-question__prompt">{q.word.vi}</div>
            <p className="v-muted">Chọn từ tiếng Anh đúng</p>
          </>
        )}
        {mode === "listen" && (
          <>
            <button type="button" className="v-listen" onClick={() => speak(q.word.w)}>
              <SpeakIcon /> Nghe lại
            </button>
            <button type="button" className="v-link" onClick={() => speak(q.word.w, 0.6)}>
              Nghe chậm
            </button>
            <p className="v-muted">Bạn nghe thấy từ nào?</p>
          </>
        )}
      </div>
      <div className="v-options">
        {q.options.map((opt, n) => {
          const state = !picked ? "" : opt.id === q.word.id ? "is-right" : opt.id === picked ? "is-wrong" : "is-dim";
          return (
            <button key={opt.id} type="button" className={`v-option ${state}`} onClick={() => choose(opt)} disabled={!!picked}>
              <kbd>{n + 1}</kbd> {label(opt)}
            </button>
          );
        })}
      </div>
      {picked && (
        <div className={`v-feedback ${picked === q.word.id ? "is-right" : "is-wrong"}`}>
          <div>
            {picked === q.word.id ? "Chính xác!" : "Chưa đúng."} <b>{q.word.w}</b> <span className="v-ipa">{q.word.ipa}</span> —{" "}
            {q.word.vi}
          </div>
          <button ref={nextRef} type="button" className="v-btn v-btn--primary" onClick={next}>
            {i + 1 < qs.length ? "Câu tiếp" : "Xem kết quả"}
          </button>
        </div>
      )}
    </div>
  );
}

function SpeakIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1.4em" height="1.4em" aria-hidden="true">
      <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z" />
    </svg>
  );
}
