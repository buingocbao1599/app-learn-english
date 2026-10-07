import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Form, Link, useLoaderData } from "react-router";
import { searchWords } from "../vocab/data.server";
import { SpeakButton } from "../vocab/components/SpeakButton";

export const meta: MetaFunction = () => [{ title: "Tra từ · Luyện Từ Vựng" }];

export const loader = ({ request }: LoaderFunctionArgs) => {
  const q = new URL(request.url).searchParams.get("q") ?? "";
  return { q, results: searchWords(q) };
};

export default function Lookup() {
  const { q, results } = useLoaderData<typeof loader>();
  return (
    <>
      <h1>Tra từ</h1>
      <Form method="get" className="v-search" role="search">
        <input
          name="q"
          defaultValue={q}
          className="v-input"
          placeholder="Nhập từ tiếng Anh hoặc nghĩa tiếng Việt (vd: apple, quả táo)"
          aria-label="Từ cần tra"
        />
        <button type="submit" className="v-btn v-btn--primary">
          Tìm
        </button>
      </Form>
      {q && <p className="v-muted">{results.length ? `${results.length} kết quả cho “${q}”` : `Không tìm thấy “${q}”.`}</p>}
      <ul className="v-results">
        {results.map((w) => (
          <li key={w.id}>
            <div>
              <SpeakButton text={w.w} /> <b>{w.w}</b> <span className="v-pos">{w.p}</span> <span className="v-ipa">{w.ipa}</span>
              <div>{w.vi}</div>
            </div>
            <Link to={`/hoc/chu-de/${w.topicSlug}`} className="v-tag">
              {w.topic}
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
