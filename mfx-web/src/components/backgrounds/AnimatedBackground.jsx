import { motion, useReducedMotion } from "framer-motion";

/**
 * Modern ambient background.
 * Layer 1 — Diagonal gradient wash (peach → cream → softBlue)
 * Layer 2 — Fine grid (masked, drifts slowly)
 * Layer 3 — Diagonal line field (drifts, gives motion)
 * Layer 4 — Slow light sweep
 * Layer 5 — Vignette (top light, bottom ground)
 *
 * Designed to be subtle — content always dominates.
 */
const AnimatedBackground = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 overflow-hidden bg-[#FFFCE1]"
    >
      {/* Layer 1 — Diagonal gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,190,145,0.22) 0%, rgba(255,252,225,0.9) 45%, rgba(207,235,255,0.22) 100%)",
        }}
      />

      {/* Layer 2 — Fine grid, masked, gently drifting */}
      <motion.div
        className="absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(26,26,46,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,46,0.9) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, black 25%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 40%, black 25%, transparent 80%)",
        }}
        animate={
          reduceMotion
            ? {}
            : { backgroundPosition: ["0px 0px", "56px 56px"] }
        }
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      />

      {/* Layer 3 — Diagonal line field, drifts slowly */}
      <motion.div
        className="absolute inset-0 opacity-[0.09]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, #1A1A2E 0px, #1A1A2E 1px, transparent 1px, transparent 34px)",
          maskImage:
            "linear-gradient(135deg, black 0%, transparent 45%, black 100%)",
          WebkitMaskImage:
            "linear-gradient(135deg, black 0%, transparent 45%, black 100%)",
        }}
        animate={
          reduceMotion
            ? {}
            : { backgroundPosition: ["0px 0px", "34px 34px"] }
        }
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* Layer 4 — Slow light sweep, peachy */}
      {!reduceMotion && (
        <motion.div
          className="absolute -inset-y-1/2 w-[55%] rotate-[18deg]"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,190,145,0.14), rgba(207,235,255,0.12), transparent)",
            filter: "blur(60px)",
          }}
          animate={{ x: ["-110%", "320%"] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            repeatDelay: 6,
          }}
        />
      )}

      {/* Layer 5a — Top light */}
      <div
        className="absolute inset-x-0 top-0 h-[60%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.55) 0%, transparent 60%)",
        }}
      />

      {/* Layer 5b — Bottom ground */}
      <div
        className="absolute inset-x-0 bottom-0 h-[50%] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(26,26,46,0.06) 0%, transparent 55%)",
        }}
      />
    </div>
  );
};

export default AnimatedBackground;