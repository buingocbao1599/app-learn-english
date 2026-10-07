import { useEffect, useMemo, useState } from "react";
import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { topics } from "../vocab/data.server";
import { getProgress, isDue, resetProgress, statusOf } from "../vocab/progress";
import { Practice } from "../vocab/components/Practice";
import type { Word } from "../vocab/types";

export const meta: MetaFunction = () => [{ title: "Ôn tập · Luyện Từ Vựng" }];

export const loader = () => ({ words: topics.flatMap((t) => t.words) });

type Scope = "due" | "learning" | "all-learned";

export default function Review() {
  const { words } = useLoaderData<typeof loader>();
  const [scope, setScope] = useState<Scope>("due");
  // snapshot after mount so the list doesn't shrink while answering
  const [list, setList] = useState<Word[] | null>(null);
  const [counts, setCounts] = useState({ due: 0, learning: 0, learned: 0 });

  useEffect(() => {
    const { cards } = getProgress();
    const now = Date.now();
    const due = words.filter((w) => isDue(cards[w.id], now));
    const learning = words.filter((w) => statusOf(cards[w.id]) === "learning");
    const learned = words.filter((w) => statusOf(cards[w.id]) !== "new");
    setCounts({ due: due.length, learning: learning.length, learned: learned.length });
    setList(scope === "due" ? due : scope === "learning" ? learning : learned);
  }, [words, scope]);

  // distractors come from the whole dictionary
  const pool = useMemo(() => words, [words]);

  return (
    <>
      <h1>Ôn tập</h1>
      <p className="v-muted">Từ trả lời đúng sẽ quay lại sau 1, 2, 4, 7, 15 rồi 30 ngày. Trả lời sai thì từ quay lại sau 10 phút.</p>
      <div className="v-chips" role="radiogroup" aria-label="Phạm vi ôn tập">
        <Chip active={scope === "due"} onClick={() => setScope("due")}>
          Đến hạn ({counts.due})
        </Chip>
        <Chip active={scope === "learning"} onClick={() => setScope("learning")}>
          Đang học ({counts.learning})
        </Chip>
        <Chip active={scope === "all-learned"} onClick={() => setScope("all-learned")}>
          Tất cả đã học ({counts.learned})
        </Chip>
      </div>
      {list === null ? null : list.length === 0 ? (
        <div className="v-empty">
          {counts.learned === 0 ? (
            <>
              Bạn chưa học từ nào. <Link to="/hoc">Chọn một chủ đề</Link> để bắt đầu.
            </>
          ) : (
            <>Không có từ nào trong mục này. Tuyệt vời!</>
          )}
        </div>
      ) : (
        <Practice key={scope} words={list} pool={pool} />
      )}
      {counts.learned > 0 && (
        <p className="v-reset">
          <button
            type="button"
            className="v-link"
            onClick={() => {
              if (window.confirm("Xoá toàn bộ tiến độ học trên trình duyệt này?")) {
                resetProgress();
                setScope("due");
                setList([]);
                setCounts({ due: 0, learning: 0, learned: 0 });
              }
            }}
          >
            Xoá tiến độ học
          </button>
        </p>
      )}
    </>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" role="radio" aria-checked={active} className={`v-chip ${active ? "is-active" : ""}`} onClick={onClick}>
      {children}
    </button>
  );
}
