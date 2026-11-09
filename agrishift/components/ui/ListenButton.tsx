"use client";

import { Square, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";
import { useVoiceOn } from "@/lib/prefs";

function frenchVoice(): SpeechSynthesisVoice | undefined {
  return window.speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith("fr"));
}

/** Lecture à voix haute ; masqué s'il n'y a pas de voix française. */
export function ListenButton({ text }: { text: string }) {
  const voiceOn = useVoiceOn();
  const [available, setAvailable] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const check = () => setAvailable(!!frenchVoice());
    const first = setTimeout(check, 0);
    window.speechSynthesis.addEventListener("voiceschanged", check);
    return () => {
      clearTimeout(first);
      window.speechSynthesis.removeEventListener("voiceschanged", check);
      window.speechSynthesis.cancel();
    };
  }, []);

  if (!voiceOn || !available) return null;

  function toggle() {
    const synth = window.speechSynthesis;
    synth.cancel();
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.voice = frenchVoice() ?? null;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }

  return (
    <button type="button" onClick={toggle} className="btn btn-ghost min-h-12 h-auto gap-2 rounded-full px-4">
      {speaking ? <Square aria-hidden="true" size={20} /> : <Volume2 aria-hidden="true" size={22} />}
      {speaking ? t.common.stop : t.common.listen}
    </button>
  );
}
