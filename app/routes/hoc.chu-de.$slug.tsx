import { useMemo, useState } from "react";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { getTopic } from "../vocab/data.server";
import { statusOf, useProgress, type Status } from "../vocab/progress";
import { Practice } from "../vocab/components/Practice";
import { SpeakButton } from "../vocab/components/SpeakButton";
import { Bar } from "../vocab/components/Done";

export const loader = ({ params }: LoaderFunctionArgs) => {
  const topic = getTopic(params.slug ?? "");
  if (!topic) throw new Response("Không tìm thấy chủ đề", { status: 404 });
  return { topic };
};

export const meta: MetaFunction<typeof loader> = ({ data }) => [{ title: `${data?.topic.name ?? "Chủ đề"} · Luyện Từ Vựng` }];

const STATUS_LABEL: Record<Status, string> = { new: "Mới", learning: "Đang học", mastered: "Đã thuộc" };

export default function TopicPage() {
  const { topic } = useLoaderData<typeof loader>();
  const progress = useProgress();
  const [tab, setTab] = useState<"practice" | "list">("practice");
  const [onlyUnmastered, setOnlyUnmastered] = useState(false);

  const mastered = topic.words.filter((w) => statusOf(progress.cards[w.id]) === "mastered").length;
  const practiceWords = useMemo(
    () => (onlyUnmastered ? topic.words.filter((w) => statusOf(progress.cards[w.id]) !== "mastered") : topic.words),
    // recompute only when the filter is toggled, not after every answer
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [topic, onlyUnmastered],
  );

  return (
    <>
      <nav className="v-crumbs">
        <Link to="/hoc">Chủ đề</Link> / <span>{topic.name}</span>
      </nav>
      <section className="v-topic-head">
        <div>
          <h1>{topic.name}</h1>
          <p className="v-muted">
            {topic.words.length} từ · đã thuộc {mastered}
          </p>
        </div>
        <div className="v-topic-head__bar">
          <Bar value={mastered} total={topic.words.length} />
        </div>
      </section>

      <div className="v-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "practice"} className={tab === "practice" ? "is-active" : ""} onClick={() => setTab("practice")}>
          Luyện tập
        </button>
        <button type="button" role="tab" aria-selected={tab === "list"} className={tab === "list" ? "is-active" : ""} onClick={() => setTab("list")}>
          Danh sách từ
        </button>
      </div>

      {tab === "practice" ? (
        <>
          <label className="v-switch v-switch--block">
            <input type="checkbox" checked={onlyUnmastered} onChange={(e) => setOnlyUnmastered(e.target.checked)} />
            Chỉ luyện những từ chưa thuộc
          </label>
          <Practice words={practiceWords} pool={topic.words} />
        </>
      ) : (
        <div className="v-table-wrap">
          <table className="v-table">
            <thead>
              <tr>
                <th>Từ vựng</th>
                <th>Loại từ</th>
                <th>Phiên âm</th>
                <th>Nghĩa</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {topic.words.map((w) => {
                const s = statusOf(progress.cards[w.id]);
                return (
                  <tr key={w.id}>
                    <td>
                      <SpeakButton text={w.w} /> <b>{w.w}</b>
                    </td>
                    <td>
                      <span className="v-pos">{w.p}</span>
                    </td>
                    <td className="v-ipa">{w.ipa}</td>
                    <td>{w.vi}</td>
                    <td>
                      <span className={`v-badge v-badge--${s}`}>{STATUS_LABEL[s]}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
