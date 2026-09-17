import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Command, X } from "lucide-react";

export default function FloatingButton({ isOpen, onClick }) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-[60] flex items-center gap-3">
      {/* Tooltip — hover only, desktop only */}
      <AnimatePresence>
        {hovered && !isOpen && (
          <motion.div
            key="label"
            initial={{ opacity: 0, x: 6 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="hidden sm:block whitespace-nowrap pointer-events-none"
          >
            <div className="rounded-lg bg-[#1A1A2E] px-3 py-1.5
                            text-[11px] font-medium tracking-tight text-white/95
                            shadow-[0_4px_16px_-4px_rgba(26,26,46,0.35)]">
              Ask AI
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Button */}
      <motion.button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        whileHover={reduceMotion ? {} : { scale: 1.04 }}
        whileTap={reduceMotion ? {} : { scale: 0.96 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        aria-label={isOpen ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={isOpen}
        className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-full
                   bg-[#1A1A2E] text-[#FFFCE1]
                   grid place-items-center
                   ring-1 ring-[#1A1A2E]
                   shadow-[0_2px_8px_-2px_rgba(26,26,46,0.25),0_8px_24px_-8px_rgba(26,26,46,0.35)]
                   hover:shadow-[0_4px_12px_-2px_rgba(26,26,46,0.3),0_12px_32px_-8px_rgba(26,26,46,0.4)]
                   transition-shadow duration-300
                   focus:outline-none focus-visible:ring-2
                   focus-visible:ring-[#FFBE91] focus-visible:ring-offset-2
                   focus-visible:ring-offset-[#FFFCE1]"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isOpen ? (
            <motion.span
              key="close"
              initial={reduceMotion ? false : { opacity: 0, rotate: -45, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={reduceMotion ? {} : { opacity: 0, rotate: 45, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid place-items-center"
            >
              <X size={16} strokeWidth={2.2} />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={reduceMotion ? false : { opacity: 0, rotate: -45, scale: 0.8 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={reduceMotion ? {} : { opacity: 0, rotate: 45, scale: 0.8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="grid place-items-center"
            >
              <Command size={15} strokeWidth={2.2} />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}