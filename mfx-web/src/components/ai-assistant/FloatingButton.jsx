import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, X } from "lucide-react";

function AnimatedText({ text }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <span>{text}</span>;
  }

  return (
    <span className="inline-block">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.35,
            delay: i * 0.022,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block"
          style={{ whiteSpace: char === " " ? "pre" : "normal" }}
        >
          {char}
        </motion.span>
      ))}
    </span>
  );
}

export default function FloatingButton({ isOpen, onClick }) {
  const reduceMotion = useReducedMotion();
  const [showHint, setShowHint] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (isOpen) return;
    const showTimer = setTimeout(() => setShowHint(true), 1200);
    const hideTimer = setTimeout(() => setShowHint(false), 5500);
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [isOpen]);

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-4">
      {/* Tooltip — vertically centered with the orb, sits to its left */}
      <AnimatePresence>
        {(showHint || hovered) && !isOpen && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="whitespace-nowrap pointer-events-none"
          >
            <div
              className="relative rounded-xl bg-[#0E0E1A]/95 backdrop-blur-sm
                         px-4 py-3 text-[13px] tracking-wide
                         text-[#FFE9C9]/90
                         ring-1 ring-white/5
                         shadow-[0_8px_32px_-4px_rgba(0,0,0,0.5),0_0_24px_rgba(255,190,145,0.12)]"
              style={{
                fontFamily:
                  "'JetBrains Mono', 'Consolas', 'Menlo', 'Monaco', ui-monospace, monospace",
              }}
            >
              <AnimatedText text="Ask me to find what you want" />

              <div
                aria-hidden="true"
                className="absolute top-1/2 -translate-y-1/2 left-full
                           w-0 h-0
                           border-y-[6px] border-y-transparent
                           border-l-[8px] border-l-[#0E0E1A]/95"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orb wrapper */}
      <motion.div
        className="relative w-14 h-14"
        animate={
          reduceMotion
            ? {}
            : {
                scaleX: [1, 1.05, 0.98, 1.02, 1],
                scaleY: [1, 0.97, 1.04, 0.99, 1],
                rotate: [0, 2, -1, 1, 0],
              }
        }
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(255,190,145,0.55) 0%, rgba(255,140,100,0.25) 40%, rgba(255,190,145,0) 75%)",
          }}
          animate={
            reduceMotion
              ? {}
              : { scale: [1, 1.55, 1], opacity: [0.55, 0.18, 0.55] }
          }
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(167,139,250,0.45) 0%, rgba(167,139,250,0) 70%)",
          }}
          animate={
            reduceMotion
              ? {}
              : { scale: [1, 1.4, 1], opacity: [0.35, 0.1, 0.35] }
          }
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.1,
          }}
        />

        <motion.div
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none border border-[#FFBE91]"
          style={{ inset: "-6px" }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={
            hovered && !reduceMotion
              ? { opacity: 0.6, scale: 1 }
              : { opacity: 0, scale: 0.9 }
          }
          transition={{ duration: 0.25, ease: "easeOut" }}
        />

        <motion.button
          onClick={onClick}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
          aria-expanded={isOpen}
          className="absolute inset-0 rounded-full grid place-items-center
                     overflow-hidden select-none will-change-transform
                     focus:outline-none focus-visible:ring-2
                     focus-visible:ring-[#FFBE91] focus-visible:ring-offset-2"
          initial={{ scale: 1 }}
          animate={{ scale: 1 }}
          whileHover={
            reduceMotion
              ? {}
              : {
                  scale: 1.18,
                  rotate: 8,
                  transition: { duration: 0.25, ease: "easeOut" },
                }
          }
          whileTap={
            reduceMotion
              ? {}
              : {
                  scale: 0.9,
                  rotate: -6,
                  transition: { duration: 0.15, ease: "easeOut" },
                }
          }
        >
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(135deg, #3E4263 0%, #535179 45%, #6B5F92 100%)",
            }}
          />

          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 will-change-transform"
              style={{
                background:
                  "radial-gradient(circle at 30% 30%, #B8A3FF 0%, rgba(184,163,255,0) 55%)",
              }}
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            />
          )}

          {!reduceMotion && (
            <motion.div
              className="absolute inset-0 will-change-transform"
              style={{
                background:
                  "radial-gradient(circle at 70% 70%, #FFC9A8 0%, rgba(255,201,168,0) 50%)",
              }}
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            />
          )}

          <div
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              background: hovered
                ? "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 55%)"
                : "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 45%)",
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              background: hovered
                ? "radial-gradient(circle at 80% 85%, rgba(255,190,145,0.7) 0%, rgba(255,190,145,0) 55%)"
                : "radial-gradient(circle at 80% 85%, rgba(255,190,145,0.5) 0%, rgba(255,190,145,0) 45%)",
            }}
          />

          <span
            className="relative z-10 grid place-items-center text-[#FFE9C9]
                       transition-all duration-300"
            style={{
              filter: hovered
                ? "drop-shadow(0 0 10px rgba(255,190,145,0.85))"
                : "drop-shadow(0 0 6px rgba(255,190,145,0.45))",
              transform: hovered ? "scale(1.1)" : "scale(1)",
            }}
          >
            {isOpen ? <X size={20} /> : <Sparkles size={20} />}
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}