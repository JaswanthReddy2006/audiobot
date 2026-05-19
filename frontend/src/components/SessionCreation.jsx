import { useState } from "react";
import { motion } from "framer-motion";

const USE_CASES = [
  { id: "general",      label: "General Chat",      icon: "💬", desc: "Everyday questions & conversation" },
  { id: "study",        label: "Study Help",         icon: "📚", desc: "Learn concepts & get explanations" },
  { id: "medical",      label: "Medical Info",       icon: "🩺", desc: "General health information" },
  { id: "mental_health",label: "Mental Support",     icon: "🧠", desc: "Talk it out, be heard" },
  { id: "technical",    label: "Tech Support",       icon: "⚙️", desc: "Debug & troubleshoot problems" },
  { id: "creative",     label: "Creative Writing",   icon: "✍️", desc: "Brainstorm & write together" },
  { id: "language",     label: "Language Practice",  icon: "🌐", desc: "Grammar, vocab, fluency" },
  { id: "business",     label: "Business Advisor",   icon: "💼", desc: "Strategy & professional advice" },
  { id: "custom",       label: "Custom",             icon: "🎛️", desc: "Define your own context" },
];

const MOODS = [
  { id: "focused",  label: "Focused",  color: "#00f5ff" },
  { id: "relaxed",  label: "Relaxed",  color: "#00ffb3" },
  { id: "stressed", label: "Stressed", color: "#ff6b6b" },
  { id: "happy",    label: "Happy",    color: "#ffc837" },
  { id: "curious",  label: "Curious",  color: "#7b2fff" },
  { id: "tired",    label: "Tired",    color: "#8899aa" },
];

export default function SessionCreation({ onStart, loading }) {
  const [useCase, setUseCase]       = useState("general");
  const [mood, setMood]             = useState("relaxed");
  const [customPrompt, setCustom]   = useState("");

  const canStart = useCase !== "custom" || customPrompt.trim().length > 5;

  return (
    <motion.div
      className="session-page"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.4 }}
    >
      <div className="session-card">
        {/* Header */}
        <div className="session-header">
          <h1 className="logo-text" style={{ fontSize: "2rem" }}>NOVA</h1>
          <p className="app-tagline">Configure your session before we begin</p>
        </div>

        {/* Use Case */}
        <section className="session-section">
          <h2 className="section-title">What can I help you with?</h2>
          <div className="usecase-grid">
            {USE_CASES.map((uc) => (
              <button
                key={uc.id}
                className={`usecase-card ${useCase === uc.id ? "active" : ""}`}
                onClick={() => setUseCase(uc.id)}
              >
                <span className="usecase-icon">{uc.icon}</span>
                <span className="usecase-label">{uc.label}</span>
                <span className="usecase-desc">{uc.desc}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Mood */}
        <section className="session-section">
          <h2 className="section-title">How are you feeling right now?</h2>
          <div className="mood-grid">
            {MOODS.map((m) => (
              <button
                key={m.id}
                className={`mood-btn ${mood === m.id ? "active" : ""}`}
                style={{ "--mood-color": m.color }}
                onClick={() => setMood(m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </section>

        {/* Custom Context */}
        <section className="session-section">
          <h2 className="section-title">
            {useCase === "custom" ? "Describe what you need *" : "Anything else I should know? (optional)"}
          </h2>
          <textarea
            className="custom-prompt-box"
            placeholder={
              useCase === "custom"
                ? "Describe exactly how you want me to behave..."
                : "e.g. I am preparing for a Java interview, I am a 3rd year student..."
            }
            value={customPrompt}
            onChange={(e) => setCustom(e.target.value)}
            rows={3}
          />
        </section>

        {/* Start Button */}
        <motion.button
          className="start-session-btn"
          onClick={() => onStart(useCase, mood, customPrompt)}
          disabled={loading || !canStart}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="spin-icon">⟳</span> Starting session...
            </span>
          ) : (
            "Start Session →"
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}
