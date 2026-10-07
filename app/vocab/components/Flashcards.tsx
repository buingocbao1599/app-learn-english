import { useEffect, useState } from "react";
import type { Word } from "../types";
import { grade } from "../progress";
import { pickSession, useSession } from "../session";
import { speak } from "../speak";
import { SpeakButton } from "./SpeakButton";
import { Bar, Done, Empty } from "./Done";

export function Flashcards({ words, size = 20 }: { words: Word[]; size?: number }) {
  const [deck, restart] = useSession(() => pickSession(words, size), [words, size]);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [viFirst, setViFirst] = useState(false);
  const [known, setKnown] = useState(0);

  useEffect(() => {
    setI(0);
    setKnown(0);
    setFlipped(false);
  }, [deck]);

  const card = deck?.[i];

  const answer = (ok: boolean) => {
    if (!card) return;
    grade(card.id, ok);
    if (ok) setKnown((k) => k + 1);
    setFlipped(false);
    setI((n) => n + 1);
  };

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select")) return;
      if (e.key === " " || e.key === "Enter") {
        // the focused card handles these itself
        if ((e.target as HTMLElement).closest(".v-card, button, a")) return;
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "1" || e.key === "ArrowLeft") answer(false);
      else if (e.key === "2" || e.key === "ArrowRight") answer(true);
      else if (e.key.toLowerCase() === "s") speak(card.w);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!deck) return <Empty>Đang chuẩn bị thẻ…</Empty>;
  if (!deck.length) return <Empty>Không có từ nào để luyện.</Empty>;
  if (!card) return <Done correct={known} total={deck.length} onRestart={restart} />;

  const front = viFirst ? (
    <div className="v-card__vi v-card__vi--big">{card.vi}</div>
  ) : (
    <>
      <div className="v-card__word">{card.w}</div>
      <div className="v-card__meta">
        <span className="v-pos">{card.p}</span> <span className="v-ipa">{card.ipa}</span>
      </div>
    </>
  );
  // the back always shows the full entry
  const back = (
    <>
      <div className="v-card__word">{card.w}</div>
      <div className="v-card__meta">
        <span className="v-pos">{card.p}</span> <span className="v-ipa">{card.ipa}</span>
      </div>
      <div className="v-card__vi v-card__vi--big">{card.vi}</div>
    </>
  );

  return (
    <div className="v-practice">
      <div className="v-practice__top">
        <span className="v-muted">
          Thẻ {i + 1}/{deck.length}
        </span>
        <label className="v-switch">
          <input type="checkbox" checked={viFirst} onChange={(e) => setViFirst(e.target.checked)} />
          Hiện nghĩa tiếng Việt trước
        </label>
      </div>
      <Bar value={i} total={deck.length} />
      <div
        // remount per card so the flip-back animation can't reveal the next answer
        key={card.id}
        className={`v-card ${flipped ? "is-flipped" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Lật thẻ"
        onClick={() => setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
      >
        <div className="v-card__inner">
          <div className="v-card__face">
            {front}
            <SpeakButton text={card.w} size="lg" />
            <div className="v-card__hint">Chạm để lật thẻ</div>
          </div>
          <div className="v-card__face v-card__face--back">
            {back}
            <SpeakButton text={card.w} size="lg" />
          </div>
        </div>
      </div>
      <div className="v-actions">
        <button type="button" className="v-btn v-btn--bad" onClick={() => answer(false)}>
          Chưa nhớ <kbd>1</kbd>
        </button>
        <button type="button" className="v-btn v-btn--good" onClick={() => answer(true)}>
          Đã nhớ <kbd>2</kbd>
        </button>
      </div>
      <p className="v-keys v-muted">Phím tắt: Space lật thẻ · S nghe · 1 chưa nhớ · 2 đã nhớ</p>
    </div>
  );
}
