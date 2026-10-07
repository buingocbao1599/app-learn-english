import type { LinksFunction } from "react-router";
import { NavLink, Outlet } from "react-router";
import styles from "../vocab/vocab.css?url";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap" },
];

export default function VocabLayout() {
  return (
    <div className="v-app">
      <header className="v-header">
        <NavLink to="/hoc" end className="v-brand">
          <span className="v-brand__logo" aria-hidden="true">
            Aa
          </span>
          Luyện Từ Vựng
        </NavLink>
        <nav className="v-nav">
          <NavLink to="/hoc" end>
            Chủ đề
          </NavLink>
          <NavLink to="/hoc/on-tap">Ôn tập</NavLink>
          <NavLink to="/hoc/tra-tu">Tra từ</NavLink>
        </nav>
      </header>
      <main className="v-main">
        <Outlet />
      </main>
      <footer className="v-footer">
        Nguồn từ vựng:{" "}
        <a href="https://drive.google.com/drive/folders/1L52XdE6Z0Sm3pR2XygUHiwoMpLcBrAm_" target="_blank" rel="noreferrer">
          thư mục Google Drive
        </a>{" "}
        (3000 từ vựng Oxford theo chủ đề · tu-vung-tieng-anh.xlsx). Tiến độ học được lưu trên trình duyệt này.
      </footer>
    </div>
  );
}
