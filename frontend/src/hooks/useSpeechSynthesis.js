import { useState, useCallback, useRef } from "react";

/** Wraps the browser SpeechSynthesis API. */
export function useSpeechSynthesis() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utterRef = useRef(null);

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate   = 0.93;
      u.pitch  = 1.05;
      u.volume = 1.0;

      // Pick a natural-sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.localService === false)
      ) || voices.find((v) => v.lang.startsWith("en"));
      if (preferred) u.voice = preferred;

      u.onstart = () => setIsSpeaking(true);
      u.onend   = () => { setIsSpeaking(false); resolve(); };
      u.onerror = () => { setIsSpeaking(false); resolve(); };
      utterRef.current = u;
      window.speechSynthesis.speak(u);
    });
  }, []);

  const cancel = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { isSpeaking, speak, cancel };
}
