import { motion, AnimatePresence } from "framer-motion";

// All possible pipeline steps in order
export const STEPS = ["IDLE", "LISTENING", "TRANSLATING", "TRANSMITTING", "THINKING", "RESPONDING", "SPEAKING"];

const STEP_META = {
  IDLE:         { label: "Ready",        sub: "Tap the mic to speak",           color: "#00ffb3" },
  LISTENING:    { label: "Listening",    sub: "Speak now...",                   color: "#00f5ff" },
  TRANSLATING:  { label: "Translating",  sub: "Converting your speech to text", color: "#7b2fff" },
  TRANSMITTING: { label: "Transmitting", sub: "Sending to NOVA...",             color: "#ffc837" },
  THINKING:     { label: "Thinking",     sub: "NOVA is processing...",          color: "#ff9f43" },
  RESPONDING:   { label: "Responding",   sub: "Response received",              color: "#00f5ff" },
  SPEAKING:     { label: "Speaking",     sub: "NOVA is talking...",             color: "#7b2fff" },
};

export default function ProcessingStep({ step }) {
  const meta = STEP_META[step] || STEP_META.IDLE;
  const activeIdx = STEPS.indexOf(step);

  return (
    <div className="processing-steps-wrap">
      {/* Step pipeline bar */}
      <div className="pipeline-bar">
        {STEPS.filter(s => s !== "IDLE").map((s, i) => {
          const sIdx = STEPS.indexOf(s);
          const done    = sIdx < activeIdx;
          const current = s === step;
          return (
            <div key={s} className={`pipeline-step ${done ? "done" : ""} ${current ? "current" : ""}`}>
              <motion.div
                className="pipeline-dot"
                style={{ "--step-color": STEP_META[s].color }}
                animate={current ? { scale: [1, 1.4, 1], opacity: [1, 0.7, 1] } : {}}
                transition={{ duration: 0.9, repeat: Infinity }}
              />
              <span className="pipeline-label">{STEP_META[s].label}</span>
              {i < STEPS.length - 2 && <div className={`pipeline-line ${done ? "done" : ""}`} />}
            </div>
          );
        })}
      </div>

      {/* Central state display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          className="step-display"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.94 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="step-orb"
            style={{ "--orb-color": meta.color }}
            animate={step !== "IDLE"
              ? { boxShadow: [`0 0 20px ${meta.color}55`, `0 0 55px ${meta.color}aa`, `0 0 20px ${meta.color}55`] }
              : {}}
            transition={{ duration: 1.2, repeat: Infinity }}
          />
          <div className="step-text">
            <span className="step-label" style={{ color: meta.color }}>{meta.label}</span>
            <span className="step-sub">{meta.sub}</span>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
