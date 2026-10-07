let voice: SpeechSynthesisVoice | null | undefined;

function pickVoice() {
  if (voice !== undefined) return voice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  voice =
    voices.find((v) => v.lang === "en-US" && /google|natural|samantha/i.test(v.name)) ??
    voices.find((v) => v.lang === "en-US") ??
    voices.find((v) => v.lang.startsWith("en")) ??
    null;
  return voice;
}

export function canSpeak() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speak(text: string, rate = 0.9) {
  if (!canSpeak()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = rate;
  const v = pickVoice();
  if (v) u.voice = v;
  synth.speak(u);
}
