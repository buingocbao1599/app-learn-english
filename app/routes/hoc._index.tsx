import type { MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { topicSummaries } from "../vocab/data.server";
import { isDue, statusOf, streak, useProgress } from "../vocab/progress";
import { Bar } from "../vocab/components/Done";

export const meta: MetaFunction = () => [{ title: "Luyện Từ Vựng Tiếng Anh" }];

export const loader = () => ({ topics: topicSummaries() });

export default function VocabHome() {
  const { topics } = useLoaderData<typeof loader>();
  const progress = useProgress();
  const now = Date.now();

  const total = topics.reduce((n, t) => n + t.count, 0);
  let learned = 0;
  let mastered = 0;
  let due = 0;
  const perTopic = topics.map((t) => {
    let l = 0;
    let m = 0;
    for (const id of t.ids) {
      const c = progress.cards[id];
      const s = statusOf(c);
      if (s !== "new") l++;
      if (s === "mastered") m++;
      if (isDue(c, now)) due++;
    }
    learned += l;
    mastered += m;
    return { ...t, learned: l, mastered: m };
  });
  const started = perTopic.filter((t) => t.learned > 0 && t.mastered < t.count);

  return (
    <>
      <section className="v-hero">
        <div>
          <h1>Học từ vựng tiếng Anh theo chủ đề</h1>
          <p className="v-muted">
            {total.toLocaleString("vi-VN")} từ trong {topics.length} chủ đề, kèm phiên âm và phát âm. Hệ thống lặp lại ngắt quãng sẽ nhắc bạn ôn đúng
            lúc sắp quên.
          </p>
        </div>
        <Link to="/hoc/on-tap" className={`v-btn v-btn--primary v-btn--lg ${due ? "" : "is-quiet"}`}>
          {due ? `Ôn tập ${due} từ đến hạn` : "Chưa có từ cần ôn"}
        </Link>
      </section>

      <section className="v-stats" aria-label="Thống kê">
        <Stat label="Đã học" value={learned} sub={`/ ${total}`} />
        <Stat label="Đã thuộc" value={mastered} />
        <Stat label="Cần ôn hôm nay" value={due} />
        <Stat label="Chuỗi ngày học" value={streak(progress)} sub="ngày" />
      </section>

      {started.length > 0 && (
        <section>
          <h2>Đang học dở</h2>
          <div className="v-grid">
            {started.slice(0, 4).map((t) => (
              <TopicCard key={t.slug} t={t} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2>Tất cả chủ đề</h2>
        <div className="v-grid">
          {perTopic.map((t) => (
            <TopicCard key={t.slug} t={t} />
          ))}
        </div>
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="v-stat">
      <div className="v-stat__value">
        {value.toLocaleString("vi-VN")} {sub && <small>{sub}</small>}
      </div>
      <div className="v-stat__label">{label}</div>
    </div>
  );
}

function TopicCard({ t }: { t: { slug: string; name: string; count: number; learned: number; mastered: number } }) {
  return (
    <Link to={`/hoc/chu-de/${t.slug}`} className="v-topic">
      <div className="v-topic__name">{t.name}</div>
      <div className="v-topic__meta v-muted">
        {t.count} từ · đã thuộc {t.mastered}
      </div>
      <Bar value={t.mastered} total={t.count} />
    </Link>
  );
}
