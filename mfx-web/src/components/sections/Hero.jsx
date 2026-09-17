import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  ShoppingCart,
  Gavel,
  Star,
  Shield,
  Zap,
  FileText,
  Command,
  ArrowUpRight,
  Check,
} from 'lucide-react';

const Hero = () => {
  const reduceMotion = useReducedMotion();
  const [tickerIndex, setTickerIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState(8200);
  const [aiText, setAiText] = useState('');
  const [aiCycle, setAiCycle] = useState(0);

  const tickerItems = [
    { text: 'iPhone 13 · ₹35k–45k · 560001' },
    { text: 'Mountain bike · ₹6k–9k · 110001' },
    { text: 'Vintage camera · ₹15k–20k · 400001' },
    { text: 'Study desk · ₹3k–5k · 700001' },
  ];

  const aiPrompts = [
    'used bike under 8000, urgent',
    'iPhone 13 around 40k',
    'furniture for new flat',
    'how many bids do I have?',
  ];

  useEffect(() => {
    if (reduceMotion) return;
    const t = setInterval(
      () => setTickerIndex((i) => (i + 1) % tickerItems.length),
      3000
    );
    return () => clearInterval(t);
  }, [reduceMotion, tickerItems.length]);

  useEffect(() => {
    if (reduceMotion) return;
    const t = setInterval(() => {
      setBidAmount((a) => a + Math.floor(Math.random() * 400) + 100);
    }, 2200);
    return () => clearInterval(t);
  }, [reduceMotion]);

  useEffect(() => {
    if (reduceMotion) return;
    const currentPrompt = aiPrompts[aiCycle % aiPrompts.length];
    if (aiText.length < currentPrompt.length) {
      const t = setTimeout(
        () => setAiText(currentPrompt.slice(0, aiText.length + 1)),
        45
      );
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setAiText('');
        setAiCycle((c) => c + 1);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [aiText, aiCycle, reduceMotion]);

  return (
    <section className="relative min-h-screen flex items-center justify-center
                        px-4 sm:px-6 pt-24 sm:pt-20 pb-16 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-10 md:gap-14 items-center">
          {/* ============ Left — content ============ */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 text-center md:text-left"
          >
            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-[28px] sm:text-3xl md:text-4xl lg:text-5xl
                         font-bold leading-[1.15] tracking-tight"
            >
              <span className="text-[#1A1A2E]">Market</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r
                               from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
                Flip
              </span>
              <br />
              <span className="text-[#1A1A2E] text-sm sm:text-base
                               md:text-lg lg:text-xl font-medium
                               mt-2 block">
                Where buyers set the price.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs sm:text-sm text-[#4A4A5A]
                         max-w-lg mx-auto md:mx-0 leading-relaxed"
            >
              Post a <StreamWord word="Request" delay={0.5} /> start an{' '}
              <StreamWord word="Auction" delay={1.3} /> or just tell the{' '}
              <StreamWord word="AI" delay={2.1} /> what you need. Shops
              compete, you pick the best deal, and every handoff is verified.
            </motion.p>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.5 }}
              className="flex items-center justify-center md:justify-start
                         gap-4 pt-3"
            >
              <div className="flex items-center -space-x-2">
                {[
                  { icon: <FileText size={11} />, color: 'from-[#FFBE91] to-[#FFDDB0]' },
                  { icon: <Gavel size={11} />, color: 'from-[#FFDDB0] to-[#CFEBFF]' },
                  { icon: <ShoppingCart size={11} />, color: 'from-[#CFEBFF] to-[#FFBE91]' },
                  { icon: <Shield size={11} />, color: 'from-[#FFBE91] to-[#CFEBFF]' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.5 + i * 0.06,
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`w-7 h-7 rounded-full border-2 border-white
                                bg-gradient-to-br ${item.color}
                                flex items-center justify-center
                                text-[#1A1A2E] shadow-sm`}
                  >
                    {item.icon}
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#1A1A2E]">
                  Trusted by 100+
                </p>
                <p className="text-[9px] text-[#A0A0B0]">
                  Buyers and shops
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* ============ Right — dynamic preview ============ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center md:justify-end"
          >
            <div className="relative w-full max-w-[300px] sm:max-w-sm md:max-w-md">
              {/* Ambient glow */}
              <div
                aria-hidden="true"
                className="absolute -inset-6 sm:-inset-8 rounded-3xl blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,190,145,0.25), transparent 60%), radial-gradient(circle at 70% 70%, rgba(207,235,255,0.25), transparent 60%)",
                }}
              />

              <div className="relative flex flex-col gap-2.5 sm:gap-3">
                {/* ===== Ticker: Request Live ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative bg-white rounded-xl sm:rounded-2xl
                             p-3 sm:p-3.5 overflow-hidden
                             ring-1 ring-[#1A1A2E]/5
                             shadow-[0_8px_24px_-8px_rgba(26,26,46,0.12),0_2px_6px_-2px_rgba(26,26,46,0.04)]"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl
                                    bg-[#FFBE91]/20 grid place-items-center
                                    flex-shrink-0">
                      <FileText size={14} className="text-[#1A1A2E]" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] sm:text-[11px] font-semibold
                                         text-[#1A1A2E] tracking-tight truncate">
                          Requests coming in
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5
                                         rounded-full text-[8px] font-medium
                                         bg-emerald-50 text-emerald-700 flex-shrink-0">
                          <motion.span
                            className="w-1 h-1 rounded-full bg-emerald-500"
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.4, repeat: Infinity }}
                          />
                          Live
                        </span>
                      </div>

                      <div className="h-4 overflow-hidden relative">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={tickerIndex}
                            initial={{ y: 14, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -14, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="text-[9px] sm:text-[10px] text-[#A0A0B0]
                                       leading-tight truncate absolute inset-0"
                          >
                            {tickerItems[tickerIndex].text}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ===== Auction with rising bid ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative bg-white rounded-xl sm:rounded-2xl
                             p-3 sm:p-3.5 ml-4 sm:ml-6 overflow-hidden
                             ring-1 ring-[#1A1A2E]/5
                             shadow-[0_8px_24px_-8px_rgba(26,26,46,0.12),0_2px_6px_-2px_rgba(26,26,46,0.04)]"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl
                                    bg-[#CFEBFF]/50 grid place-items-center
                                    flex-shrink-0">
                      <Gavel size={14} className="text-[#1A1A2E]" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] sm:text-[11px] font-semibold
                                         text-[#1A1A2E] tracking-tight truncate">
                          Auction live
                        </span>
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5
                                         rounded-full text-[8px] font-medium
                                         bg-[#FFBE91]/20 text-[#1A1A2E] flex-shrink-0">
                          <motion.span
                            animate={{ y: [0, -2, 0] }}
                            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                          >
                            <ArrowUpRight size={8} />
                          </motion.span>
                          Rising
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[9px] sm:text-[10px] text-[#A0A0B0]
                                      leading-tight truncate">
                          Mountain bike
                        </p>
                        <motion.span
                          key={bidAmount}
                          initial={{ y: -8, opacity: 0, scale: 0.9 }}
                          animate={{ y: 0, opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="text-[10px] sm:text-[11px] font-semibold
                                     text-emerald-600 tabular-nums flex-shrink-0"
                        >
                          ₹{bidAmount.toLocaleString('en-IN')}
                        </motion.span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-0.5 w-full bg-[#F8F6F0] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[#FFBE91] to-[#CFEBFF]"
                      animate={{ width: ['40%', '85%', '40%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </motion.div>

                {/* ===== AI with live typing ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative bg-[#1A1A2E] rounded-xl sm:rounded-2xl
                             p-3 sm:p-3.5 mr-3 sm:mr-4 overflow-hidden
                             ring-1 ring-white/10
                             shadow-[0_8px_24px_-8px_rgba(26,26,46,0.35)]"
                >
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl
                                    bg-[#FFFCE1] grid place-items-center
                                    flex-shrink-0">
                      <Command size={14} className="text-[#1A1A2E]" strokeWidth={2.2} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] sm:text-[11px] font-semibold
                                         text-[#FFFCE1] tracking-tight">
                          Ask AI
                        </span>
                        <motion.span
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 1.8, repeat: Infinity }}
                        >
                          <Shield size={9} className="text-[#FFBE91]" />
                        </motion.span>
                      </div>

                      <div className="h-4 overflow-hidden">
                        <p className="text-[9px] sm:text-[10px] text-[#FFFCE1]/70
                                      leading-tight truncate">
                          "{aiText}
                          <motion.span
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ duration: 0.8, repeat: Infinity }}
                            className="inline-block w-px h-3 align-middle
                                       bg-[#FFBE91] ml-0.5"
                          />
                          "
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* ===== Handoff verified ===== */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  className="relative bg-white rounded-xl sm:rounded-2xl
                             p-3 sm:p-3.5 ml-8 sm:ml-12
                             ring-1 ring-[#1A1A2E]/5
                             shadow-[0_8px_24px_-8px_rgba(26,26,46,0.12),0_2px_6px_-2px_rgba(26,26,46,0.04)]"
                >
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <motion.div
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl
                                 bg-emerald-50 grid place-items-center
                                 flex-shrink-0"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <motion.div
                        initial={{ scale: 0.7, opacity: 0.5 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 1.1 }}
                      >
                        <Check size={14} className="text-emerald-700" strokeWidth={2.6} />
                      </motion.div>
                    </motion.div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] sm:text-[11px] font-semibold
                                         text-[#1A1A2E] tracking-tight truncate">
                          Handoff verified
                        </span>
                      </div>
                      <p className="text-[9px] sm:text-[10px] text-[#A0A0B0]
                                    leading-tight truncate">
                        OTP confirmed · Transaction complete
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          initial={{ scale: 0.6, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{
                            delay: 1.3 + i * 0.12,
                            duration: 0.3,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          <Star
                            size={9}
                            className="fill-[#FFBE91] text-[#FFBE91]"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Floating accent dots */}
              <motion.span
                className="absolute -top-2 right-6 sm:right-8 w-1.5 h-1.5
                           rounded-full bg-[#FFBE91]"
                animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.span
                className="absolute -bottom-2 left-8 sm:left-12 w-1.5 h-1.5
                           rounded-full bg-[#CFEBFF]"
                animate={{ y: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.6,
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

function StreamWord({ word, delay = 0 }) {
  const chars = word.split('');
  return (
    <motion.span
      className="relative inline-block text-[#1A1A2E] font-medium"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.07, delayChildren: delay },
        },
      }}
    >
      {chars.map((char, i) => (
        <motion.span
          key={i}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 6, filter: 'blur(4px)' },
            visible: {
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
              transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
            },
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

export default Hero;