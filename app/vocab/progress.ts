import { useSyncExternalStore } from "react";

// Leitner-style spaced repetition, stored per browser.
export type Card = {
  box: number; // 0 = new, 1-3 = learning, 4+ = mastered
  due: number;
  correct: number;
  wrong: number;
  last: number;
};

export type Progress = {
  cards: Record<string, Card>;
  days: string[]; // local dates (YYYY-MM-DD) with at least one answer
};

const KEY = "vocab-progress-v1";
const DAY = 24 * 60 * 60 * 1000;
const INTERVAL_DAYS = [0, 1, 2, 4, 7, 15, 30];
export const MASTERED_BOX = 4;
const EMPTY: Progress = { cards: {}, days: [] };

let cache: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? (JSON.parse(raw) as Progress) : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: Progress) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage full or blocked: progress stays in memory for this tab
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useProgress() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function getProgress() {
  return read();
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function grade(id: string, ok: boolean) {
  const p = read();
  const now = Date.now();
  const c = p.cards[id] ?? { box: 0, due: now, correct: 0, wrong: 0, last: 0 };
  const box = ok ? Math.min(c.box + 1, INTERVAL_DAYS.length - 1) : 1;
  const card: Card = {
    box,
    // a missed word comes back in 10 minutes
    due: ok ? now + INTERVAL_DAYS[box] * DAY : now + 10 * 60 * 1000,
    correct: c.correct + (ok ? 1 : 0),
    wrong: c.wrong + (ok ? 0 : 1),
    last: now,
  };
  const d = today();
  write({
    cards: { ...p.cards, [id]: card },
    days: p.days.includes(d) ? p.days : [...p.days, d].slice(-400),
  });
}

export function resetProgress() {
  write(EMPTY);
}

export type Status = "new" | "learning" | "mastered";

export function statusOf(card: Card | undefined): Status {
  if (!card || card.box === 0) return "new";
  return card.box >= MASTERED_BOX ? "mastered" : "learning";
}

export function isDue(card: Card | undefined, now = Date.now()) {
  return !!card && card.box > 0 && card.due <= now;
}

export function streak(p: Progress) {
  const set = new Set(p.days);
  const d = new Date();
  let n = 0;
  // today not practiced yet still keeps yesterday's streak alive
  if (!set.has(fmt(d))) d.setDate(d.getDate() - 1);
  while (set.has(fmt(d))) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
