import { useState, useRef, useCallback } from "react";

/** Wraps the browser Web Speech API (SpeechRecognition). */
export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const recRef = useRef(null);

  /** Returns a Promise that resolves with the recognised transcript string. */
  const listen = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) throw new Error("Speech recognition not supported in this browser. Try Chrome.");

    return new Promise((resolve, reject) => {
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      recRef.current = rec;

      rec.onstart  = () => setIsListening(true);
      rec.onend    = () => setIsListening(false);
      rec.onerror  = (e) => { setIsListening(false); reject(new Error(e.error)); };
      rec.onresult = (e) => {
        const t = e.results[0][0].transcript.trim();
        resolve(t);
      };
      rec.start();
    });
  }, []);

  const cancel = useCallback(() => {
    recRef.current?.abort();
    setIsListening(false);
  }, []);

  return { isListening, listen, cancel };
}
