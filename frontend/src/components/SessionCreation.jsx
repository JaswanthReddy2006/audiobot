import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchModels, loadModel } from "../api/session";

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

  // Model Selection states
  const [models, setModels]         = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [fetchingModels, setFetchingModels] = useState(false);
  const [loadingModelMsg, setLoadingModelMsg] = useState("");
  const [modelError, setModelError] = useState("");

  // Fetch models from LM Studio on mount
  useEffect(() => {
    async function loadInitialModels() {
      setFetchingModels(true);
      setModelError("");
      try {
        const modelList = await fetchModels();
        setModels(modelList);
        if (modelList.length > 0) {
          // Default to the first active model returned
          setSelectedModel(modelList[0].id);
        }
      } catch (err) {
        console.error("Failed to load models list:", err);
        setModelError("Could not retrieve models. Ensure LM Studio server is started via Tailscale.");
      } finally {
        setFetchingModels(false);
      }
    }
    loadInitialModels();
  }, []);

  // Handle manual model reloading in LM Studio
  const handleLoadModel = async () => {
    if (!selectedModel) return;
    setLoadingModelMsg("Instructing LM Studio to load model...");
    setModelError("");
    try {
      await loadModel(selectedModel);
      alert(`🎯 Successfully loaded ${selectedModel} in LM Studio!`);
    } catch (err) {
      console.error(err);
      setModelError(`Failed to load model: ${err.message}`);
    } finally {
      setLoadingModelMsg("");
    }
  };

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

        {/* Dynamic Model Selection Section */}
        <section className="session-section">
          <h2 className="section-title">Select LM Studio Model</h2>
          <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
            {fetchingModels ? (
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                ⟳ Fetching active models...
              </span>
            ) : models.length === 0 ? (
              <span style={{ fontSize: "0.8rem", color: "#ff6b6b", fontFamily: "var(--font-mono)" }}>
                ⚠️ No loaded models found. Please start a model in LM Studio.
              </span>
            ) : (
              <select
                className="custom-prompt-box"
                style={{ flex: 1, height: "42px", padding: "0 14px", cursor: "pointer" }}
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id} style={{ background: "#0b142d", color: "#fff" }}>
                    {m.id}
                  </option>
                ))}
              </select>
            )}

            <motion.button
              className="mood-btn"
              style={{ height: "42px", border: "1px solid var(--neon-cyan)", color: "var(--neon-cyan)", background: "rgba(0,245,255,0.06)", fontWeight: "600" }}
              onClick={handleLoadModel}
              disabled={!selectedModel || !!loadingModelMsg}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loadingModelMsg ? "Loading..." : "🔄 Reload Model"}
            </motion.button>

            <motion.button
              className="mood-btn"
              style={{ height: "42px", border: "1px solid var(--text-muted)", color: "var(--text-secondary)", background: "transparent" }}
              onClick={async () => {
                setFetchingModels(true);
                try {
                  const list = await fetchModels();
                  setModels(list);
                  if (list.length > 0 && !list.some(m => m.id === selectedModel)) {
                    setSelectedModel(list[0].id);
                  }
                } catch (e) {
                  setModelError("Failed to refresh models list.");
                } finally {
                  setFetchingModels(false);
                }
              }}
              disabled={fetchingModels}
              whileHover={{ scale: 1.02 }}
            >
              Refresh
            </motion.button>
          </div>

          {loadingModelMsg && (
            <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "var(--neon-gold)", marginTop: "6px" }}>
              ⏳ {loadingModelMsg} (This can take 10-30 seconds depending on model size)
            </p>
          )}

          {modelError && (
            <p style={{ fontSize: "0.75rem", fontFamily: "var(--font-mono)", color: "#ff6b6b", marginTop: "6px" }}>
              ⚠️ {modelError}
            </p>
          )}
        </section>

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
          onClick={() => onStart(useCase, mood, customPrompt, selectedModel)}
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
