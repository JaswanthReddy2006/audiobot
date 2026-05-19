import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProcessingStep from "./ProcessingStep";
import MessageBubble from "./MessageBubble";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "../hooks/useSpeechSynthesis";
import { sendChat } from "../api/chat";
import { endSession } from "../api/session";

export default function VoiceInterface({ sessionId, sessionMeta, onSessionEnd }) {
  const [step, setStep]       = useState("IDLE");
  const [messages, setMessages] = useState([]);
  const [error, setError]     = useState(null);
  const [userText, setUserText] = useState("");
  const busy = useRef(false);
  const chatEndRef = useRef(null);

  const { isListening, listen, cancel: cancelListen } = useSpeechRecognition();
  const { isSpeaking, speak, cancel: cancelSpeak }    = useSpeechSynthesis();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleMic = useCallback(async () => {
    if (busy.current) return;
    setError(null);
    busy.current = true;

    try {
      // 1. LISTENING
      setStep("LISTENING");
      const transcript = await listen();
      if (!transcript) { setStep("IDLE"); busy.current = false; return; }

      // 2. TRANSLATING (speech→text done on device)
      setStep("TRANSLATING");
      setUserText(transcript);
      setMessages(prev => [...prev, { id: Date.now(), role: "user", text: transcript }]);
      await sleep(400);

      // 3. TRANSMITTING
      setStep("TRANSMITTING");
      const { text: aiText } = await sendChat(sessionId, transcript);

      // 4. THINKING (shown briefly while we process the response)
      setStep("THINKING");
      await sleep(300);

      // 5. RESPONDING
      setStep("RESPONDING");
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "ai", text: aiText }]);
      await sleep(400);

      // 6. SPEAKING
      setStep("SPEAKING");
      await speak(aiText);

    } catch (err) {
      setError(err.message);
    } finally {
      setStep("IDLE");
      setUserText("");
      busy.current = false;
    }
  }, [sessionId, listen, speak]);

  const handleEndSession = async () => {
    cancelListen();
    cancelSpeak();
    await endSession(sessionId);
    onSessionEnd();
  };

  const isBusy = step !== "IDLE";

  return (
    <div className="voice-page">
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <div className="voice-topbar">
        <div>
          <span className="logo-text" style={{ fontSize: "1.4rem" }}>NOVA</span>
          <span className="session-badge">{sessionMeta.useCase} · {sessionMeta.mood}</span>
        </div>
        <button className="end-btn" onClick={handleEndSession}>End Session</button>
      </div>

      {/* ── Processing pipeline ───────────────────────────────────── */}
      <ProcessingStep step={step} />

      {/* ── Live transcript ───────────────────────────────────────── */}
      <AnimatePresence>
        {userText && step === "TRANSLATING" && (
          <motion.div
            className="live-transcript"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            "{userText}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat history ─────────────────────────────────────────── */}
      <div className="voice-chat" id="chat-log" role="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="chat-empty">
            <motion.span
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ fontSize: "2.2rem" }}
            >🌌</motion.span>
            <p style={{ fontSize: "0.78rem", fontFamily: "var(--font-mono)", color: "var(--text-muted)", marginTop: 8 }}>
              Tap the mic and start speaking
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => <MessageBubble key={m.id} message={m} index={i} />)}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* ── Error ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {error && (
          <motion.div className="error-banner" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setError(null)}>
            ⚠ {error} · tap to dismiss
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mic button ───────────────────────────────────────────── */}
      <div className="mic-area">
        <div className="mic-button-wrapper">
          {[110, 140, 170].map(sz => (
            <div key={sz} className={`mic-ring ${step === "LISTENING" ? "recording" : ""}`}
              style={{ width: sz, height: sz }} />
          ))}
          <motion.button
            id="mic-button"
            className={`mic-button ${step === "LISTENING" ? "recording" : ""} ${isBusy && step !== "LISTENING" ? "processing" : ""}`}
            onClick={handleMic}
            disabled={isBusy && step !== "LISTENING"}
            whileHover={!isBusy ? { scale: 1.1 } : {}}
            whileTap={!isBusy ? { scale: 0.93 } : {}}
            aria-label={isBusy ? "Processing" : "Start speaking"}
          >
            {step === "LISTENING" ? <StopIcon /> : step === "IDLE" ? <MicIcon /> : <SpinnerIcon />}
          </motion.button>
        </div>
        <span className={`mic-label ${step === "LISTENING" ? "recording" : ""} ${isBusy && step !== "LISTENING" ? "processing" : ""}`}>
          {step === "IDLE" ? "Tap to Speak" : step === "LISTENING" ? "● Listening" : step}
        </span>
      </div>
    </div>
  );
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mic-icon">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>
);

const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="mic-icon">
    <rect x="6" y="6" width="12" height="12" rx="2"/>
  </svg>
);

const SpinnerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" className="mic-icon"
    style={{ animation: "processingRotate 1s linear infinite" }}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
  </svg>
);
