import { motion, AnimatePresence } from "framer-motion";

/**
 * A single floating chat message bubble.
 * Animates in with a spring effect and drifts gently.
 */
export default function MessageBubble({ message, index }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      className={`message-bubble ${isUser ? "user" : "ai"}`}
      initial={{ opacity: 0, y: 30, scale: 0.88 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        // Subtle infinite float after appearing
      }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: 0,
      }}
      layout
    >
      <span className="bubble-label">
        {isUser ? "You" : "NOVA"}
      </span>
      <motion.div
        className="bubble-content"
        animate={{
          y: [0, isUser ? -3 : -4, 0],
        }}
        transition={{
          duration: isUser ? 4.5 : 5.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: index * 0.3,
        }}
      >
        {message.text}
      </motion.div>
    </motion.div>
  );
}
