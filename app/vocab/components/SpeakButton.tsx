import { speak } from "../speak";

export function SpeakButton({ text, label = "Nghe phát âm", size = "md" }: { text: string; label?: string; size?: "md" | "lg" }) {
  return (
    <button
      type="button"
      className={`v-speak v-speak--${size}`}
      aria-label={`${label}: ${text}`}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        speak(text);
      }}
    >
      <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
        <path fill="currentColor" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.47 4.47 0 0 0 2.5-4zM14 3.23v2.06a7 7 0 0 1 0 13.42v2.06A9 9 0 0 0 14 3.23z" />
      </svg>
    </button>
  );
}
