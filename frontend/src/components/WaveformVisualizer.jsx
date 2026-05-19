import { motion } from "framer-motion";

/**
 * Waveform visualizer shown when recording is active.
 * 20 bars animate with staggered delays to create a live audio wave look.
 */
export default function WaveformVisualizer({ active }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);

  if (!active) return null;

  return (
    <motion.div
      className="waveform-container"
      initial={{ opacity: 0, scaleY: 0 }}
      animate={{ opacity: 1, scaleY: 1 }}
      exit={{ opacity: 0, scaleY: 0 }}
      transition={{ duration: 0.3 }}
    >
      {bars.map((i) => (
        <motion.div
          key={i}
          className="waveform-bar"
          animate={{
            height: [
              `${6 + Math.random() * 6}px`,
              `${12 + Math.random() * 20}px`,
              `${6 + Math.random() * 6}px`,
            ],
          }}
          transition={{
            duration: 0.6 + Math.random() * 0.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.05,
          }}
          style={{ minHeight: "6px" }}
        />
      ))}
    </motion.div>
  );
}
