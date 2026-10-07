import { useCallback, useEffect, useState } from "react";
import type { Word } from "./types";
import { getProgress, isDue, statusOf } from "./progress";

export function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Due words first, then new, then still-learning, then mastered.
export function pickSession(words: Word[], size: number) {
  const { cards } = getProgress();
  const rank = (w: Word) => {
    const c = cards[w.id];
    if (isDue(c)) return 0;
    const s = statusOf(c);
    return s === "new" ? 1 : s === "learning" ? 2 : 3;
  };
  const groups = [0, 1, 2, 3].map((r) => shuffle(words.filter((w) => rank(w) === r)));
  return groups.flat().slice(0, size);
}

// Sessions are random and read localStorage, so they are built after mount
// to keep server and client render identical.
export function useSession<T>(build: () => T, deps: unknown[]) {
  const [value, setValue] = useState<T | null>(null);
  const [round, setRound] = useState(0);
  useEffect(() => {
    setValue(build());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, round]);
  const restart = useCallback(() => setRound((r) => r + 1), []);
  return [value, restart] as const;
}
