import { useState } from "react";
import type { Word } from "../types";
import { Flashcards } from "./Flashcards";
import { Quiz, type QuizMode } from "./Quiz";
import { Spelling } from "./Spelling";

export type Mode = "flash" | QuizMode | "spell";

export const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "flash", label: "Thẻ ghi nhớ", desc: "Lật thẻ, tự đánh giá" },
  { id: "en-vi", label: "Anh → Việt", desc: "Chọn nghĩa đúng" },
  { id: "vi-en", label: "Việt → Anh", desc: "Chọn từ đúng" },
  { id: "listen", label: "Nghe", desc: "Nghe và chọn từ" },
  { id: "spell", label: "Chính tả", desc: "Gõ lại từ" },
];

export function Practice({ words, pool, initial = "flash" }: { words: Word[]; pool: Word[]; initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  return (
    <div>
      <div className="v-modes" role="tablist" aria-label="Chế độ luyện tập">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={mode === m.id}
            className={`v-mode ${mode === m.id ? "is-active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            <b>{m.label}</b>
            <span>{m.desc}</span>
          </button>
        ))}
      </div>
      {mode === "flash" && <Flashcards words={words} />}
      {(mode === "en-vi" || mode === "vi-en" || mode === "listen") && <Quiz key={mode} words={words} pool={pool} mode={mode} />}
      {mode === "spell" && <Spelling words={words} />}
    </div>
  );
}
