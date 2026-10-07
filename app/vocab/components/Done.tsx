export function Done({ correct, total, onRestart, children }: { correct: number; total: number; onRestart: () => void; children?: React.ReactNode }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="v-done">
      <div className="v-done__score">{pct}%</div>
      <p>
        Bạn trả lời đúng <b>{correct}</b>/{total} từ.{" "}
        {pct === 100 ? "Xuất sắc!" : pct >= 70 ? "Làm tốt lắm!" : "Ôn lại thêm một lượt nhé."}
      </p>
      {children}
      <button type="button" className="v-btn v-btn--primary" onClick={onRestart}>
        Luyện lượt mới
      </button>
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="v-empty">{children}</div>;
}

export function Bar({ value, total }: { value: number; total: number }) {
  return (
    <div className="v-bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={value}>
      <span style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
    </div>
  );
}
