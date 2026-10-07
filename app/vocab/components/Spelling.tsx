import { useEffect, useRef, useState } from "react";
import type { Word } from "../types";
import { grade } from "../progress";
import { pickSession, useSession } from "../session";
import { speak } from "../speak";
import { SpeakButton } from "./SpeakButton";
import { Bar, Done, Empty } from "./Done";

const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ").replace(/[’`]/g, "'");

function hintOf(word: string, shown: number) {
  let n = 0;
  return word.replace(/[A-Za-z]/g, (ch) => (n++ < shown ? ch : "_"));
}

export function Spelling({ words, size = 10 }: { words: Word[]; size?: number }) {
  const [deck, restart] = useSession(() => pickSession(words, size), [words, size]);
  const [i, setI] = useState(0);
  const [value, setValue] = useState("");
  const [hints, setHints] = useState(0);
  const [result, setResult] = useState<null | boolean>(null);
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setI(0);
    setScore(0);
    reset();
  }, [deck]);

  const w = deck?.[i];

  function reset() {
    setValue("");
    setHints(0);
    setResult(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  if (!deck) return <Empty>Đang chuẩn bị…</Empty>;
  if (!deck.length) return <Empty>Không có từ nào để luyện.</Empty>;
  if (!w) return <Done correct={score} total={deck.length} onRestart={restart} />;

  const check = (e: React.FormEvent) => {
    e.preventDefault();
    if (result !== null || !value.trim()) return;
    // using two or more hints counts as not remembered yet
    const ok = norm(value) === norm(w.w) && hints < 2;
    setResult(norm(value) === norm(w.w));
    grade(w.id, ok);
    if (ok) setScore((s) => s + 1);
    speak(w.w);
    setTimeout(() => nextRef.current?.focus(), 0);
  };

  const next = () => {
    setI((n) => n + 1);
    reset();
  };

  return (
    <div className="v-practice">
      <div className="v-practice__top">
        <span className="v-muted">
          Từ {i + 1}/{deck.length}
        </span>
        <span className="v-muted">Đúng: {score}</span>
      </div>
      <Bar value={i} total={deck.length} />
      <div className="v-question">
        <div className="v-question__prompt">{w.vi}</div>
        <div className="v-card__meta">
          <span className="v-pos">{w.p}</span> <span className="v-ipa">{w.ipa}</span> <SpeakButton text={w.w} label="Nghe gợi ý" />
        </div>
        {hints > 0 && <div className="v-hint">{hintOf(w.w, hints)}</div>}
      </div>
      <form className="v-spell" onSubmit={check}>
        <input
          ref={inputRef}
          className={`v-input ${result === true ? "is-right" : result === false ? "is-wrong" : ""}`}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Gõ từ tiếng Anh…"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          readOnly={result !== null}
          aria-label="Từ tiếng Anh"
        />
        {result === null ? (
          <div className="v-actions">
            <button type="button" className="v-btn" onClick={() => setHints((h) => Math.min(h + 1, w.w.length))}>
              Gợi ý
            </button>
            <button type="submit" className="v-btn v-btn--primary">
              Kiểm tra
            </button>
          </div>
        ) : null}
      </form>
      {result !== null && (
        <div className={`v-feedback ${result ? "is-right" : "is-wrong"}`}>
          <div>
            {result ? (hints >= 2 ? "Đúng rồi (có dùng gợi ý)." : "Chính xác!") : "Chưa đúng. Đáp án:"} <b>{w.w}</b>{" "}
            <span className="v-ipa">{w.ipa}</span>
          </div>
          <button ref={nextRef} type="button" className="v-btn v-btn--primary" onClick={next}>
            {i + 1 < deck.length ? "Từ tiếp" : "Xem kết quả"}
          </button>
        </div>
      )}
    </div>
  );
}
