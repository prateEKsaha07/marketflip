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
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ============ Live Stats Strip ============ */
const LiveStatsStrip = ({ reduceMotion }) => {
  const [stats, setStats] = useState({
    requests: 247,
    shops: 89,
    deals: 12.4,
  });

  // Flash state per metric (to briefly highlight when value changes)
  const [flash, setFlash] = useState({
    requests: false,
    shops: false,
    deals: false,
  });

  useEffect(() => {
    if (reduceMotion) return;

    // Requests: +1 to +4 every 9–14s
    const requestsTimer = setInterval(() => {
      setStats((s) => ({ ...s, requests: s.requests + Math.floor(Math.random() * 4) + 1 }));
      setFlash((f) => ({ ...f, requests: true }));
      setTimeout(() => setFlash((f) => ({ ...f, requests: false })), 800);
    }, 11000);

    // Shops: +1 every 13–18s
    const shopsTimer = setInterval(() => {
      setStats((s) => ({ ...s, shops: s.shops + 1 }));
      setFlash((f) => ({ ...f, shops: true }));
      setTimeout(() => setFlash((f) => ({ ...f, shops: false })), 800);
    }, 15000);

    // Deals: +0.1 to +0.4 every 8–12s
    const dealsTimer = setInterval(() => {
      setStats((s) => ({
        ...s,
        deals: Math.round((s.deals + Math.random() * 0.3 + 0.1) * 10) / 10,
      }));
      setFlash((f) => ({ ...f, deals: true }));
      setTimeout(() => setFlash((f) => ({ ...f, deals: false })), 800);
    }, 10000);

    return () => {
      clearInterval(requestsTimer);
      clearInterval(shopsTimer);
      clearInterval(dealsTimer);
    };
  }, [reduceMotion]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="inline-flex flex-wrap items-center justify-center md:justify-start
                 gap-x-3 gap-y-1.5
                 px-3.5 py-2 rounded-full
                 bg-white/60 backdrop-blur-sm
                 ring-1 ring-[#1A1A2E]/5
                 shadow-[0_2px_8px_-2px_rgba(26,26,46,0.06)]"
    >
      <StatItem
        icon={
          <motion.span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
            animate={reduceMotion ? {} : { opacity: [1, 0.4, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        }
        value={stats.requests}
        suffix="requests posted today"
        flash={flash.requests}
      />

      <Divider />

      <StatItem
        value={stats.shops}
        suffix="shops bidding"
        flash={flash.shops}
      />

      <Divider />

      <StatItem
        prefix="₹"
        value={stats.deals.toFixed(1)}
        suffix="L in deals"
        flash={flash.deals}
      />
    </motion.div>
  );
};

/* ============ Stat Item ============ */
const StatItem = ({ icon, prefix, value, suffix, flash }) => {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] leading-none">
      {icon}
      <span className="inline-flex items-baseline gap-0.5">
        {prefix && (
          <span className="text-[#1A1A2E] font-semibold">{prefix}</span>
        )}
        <motion.span
          key={value}
          initial={{ y: -4, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className={`font-semibold tabular-nums transition-colors duration-500 ${
            flash ? 'text-emerald-600' : 'text-[#1A1A2E]'
          }`}
        >
          {value}
        </motion.span>
      </span>
      <span className="text-[#A0A0B0] font-normal">{suffix}</span>
    </span>
  );
};

/* ============ Divider ============ */
const Divider = () => (
  <span className="w-1 h-1 rounded-full bg-[#1A1A2E]/20" aria-hidden="true" />
);

/* ============ Hero ============ */
const Hero = () => {
  const navigate = useNavigate();
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
    <section className="relative min-h-screen flex items-center
                        px-4 sm:px-6 pt-28 sm:pt-24 pb-20 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-12 gap-10 md:gap-8 items-center">
          {/* ============ Left — content (7/12) ============ */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-7 space-y-5 sm:space-y-6
                       text-center md:text-left"
          >
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="inline-flex items-center gap-2
                         px-3 py-1.5 rounded-full
                         bg-[#FFBE91]/10
                         border border-[#FFBE91]/20"
            >
              <Zap size={11} className="text-[#FFBE91]" />
              <span className="text-[10px] font-semibold text-[#1A1A2E]
                               tracking-wide uppercase">
                Buyers set the price
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="font-bold tracking-tight leading-[1.05]"
            >
              <span className="block text-[38px] sm:text-5xl
                               md:text-[54px] lg:text-[62px]
                               text-[#1A1A2E]">
                Market
                <span className="text-transparent bg-clip-text
                                 bg-gradient-to-r
                                 from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
                  Flip
                </span>
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg md:text-xl
                         font-medium text-[#1A1A2E]/70
                         max-w-md mx-auto md:mx-0"
            >
              Where buyers set the price.
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-[13px] sm:text-sm text-[#4A4A5A]
                         max-w-lg mx-auto md:mx-0 leading-relaxed"
            >
              Post a <StreamWord word="Request" delay={0.5} /> start an{' '}
              <StreamWord word="Auction" delay={1.3} /> or just tell the{' '}
              <StreamWord word="AI" delay={2.1} /> what you need. Shops
              compete, you pick the best deal, and every handoff is
              verified.
            </motion.p>

            {/* CTA buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap items-center justify-center md:justify-start
                         gap-3 pt-1"
            >
              <motion.button
                onClick={() => navigate('/auth')}
                whileHover={reduceMotion ? {} : { scale: 1.02 }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="group inline-flex items-center gap-2
                           bg-[#1A1A2E] hover:bg-[#2A2A3E]
                           text-[#FFFCE1]
                           text-[13px] font-semibold
                           px-5 py-3 rounded-full
                           shadow-[0_8px_24px_-8px_rgba(26,26,46,0.5)]
                           hover:shadow-[0_12px_32px_-8px_rgba(26,26,46,0.6)]
                           transition-all"
              >
                Get Started
                <ArrowRight
                  size={14}
                  className="transition-transform duration-200
                             group-hover:translate-x-0.5"
                  strokeWidth={2.2}
                />
              </motion.button>

              <motion.button
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                whileHover={reduceMotion ? {} : { scale: 1.02 }}
                whileTap={reduceMotion ? {} : { scale: 0.97 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex items-center gap-2
                           bg-transparent hover:bg-[#1A1A2E]/5
                           text-[#1A1A2E]
                           text-[13px] font-medium
                           px-5 py-3 rounded-full
                           border border-[#1A1A2E]/15
                           transition-all"
              >
                See How It Works
              </motion.button>
            </motion.div>

            {/* ============ NEW: Live stats strip ============ */}
            <div className="pt-2 flex justify-center md:justify-start">
              <LiveStatsStrip reduceMotion={reduceMotion} />
            </div>

            {/* Trust row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center
                         md:justify-start gap-5 pt-3"
            >
              <div className="flex items-center -space-x-2.5">
                {[
                  { icon: <FileText size={13} />, color: 'from-[#FFBE91] to-[#FFDDB0]' },
                  { icon: <Gavel size={13} />, color: 'from-[#FFDDB0] to-[#CFEBFF]' },
                  { icon: <ShoppingCart size={13} />, color: 'from-[#CFEBFF] to-[#FFBE91]' },
                  { icon: <Shield size={13} />, color: 'from-[#FFBE91] to-[#CFEBFF]' },
                  { icon: <Star size={13} />, color: 'from-[#CFEBFF] to-[#FFDDB0]' },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: 0.8 + i * 0.06,
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`w-9 h-9 rounded-full
                                border-[2.5px] border-white
                                bg-gradient-to-br ${item.color}
                                flex items-center justify-center
                                text-[#1A1A2E]
                                shadow-[0_2px_6px_-2px_rgba(26,26,46,0.15)]`}
                  >
                    {item.icon}
                  </motion.div>
                ))}
              </div>

              <div className="border-l border-[#1A1A2E]/10 pl-5">
                <p className="text-[13px] font-semibold text-[#1A1A2E]
                              leading-tight">
                  Trusted by 100+
                </p>
                <p className="text-[11px] text-[#A0A0B0] leading-tight mt-0.5">
                  buyers and shops across India
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* ============ Right — dynamic preview (5/12) ============ */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 relative flex justify-center md:justify-end"
          >
            <div
              aria-hidden="true"
              className="hidden md:block absolute -left-8 top-8 bottom-8 w-px
                         bg-gradient-to-b from-transparent
                         via-[#1A1A2E]/10 to-transparent"
            />

            <div className="relative w-full max-w-[320px] sm:max-w-sm md:max-w-md">
              <div
                aria-hidden="true"
                className="absolute -inset-10 rounded-3xl blur-3xl"
                style={{
                  background:
                    "radial-gradient(circle at 30% 30%, rgba(255,190,145,0.28), transparent 60%), radial-gradient(circle at 70% 70%, rgba(207,235,255,0.28), transparent 60%)",
                }}
              />

              <div className="relative flex flex-col gap-2.5 sm:gap-3">
                {/* Ticker */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

                {/* Auction */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

                {/* AI */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

                {/* Handoff verified */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.85, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
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

              <motion.span
                className="absolute -top-2 right-6 sm:right-8 w-1.5 h-1.5
                           rounded-full bg-[#FFBE91]"
                animate={{ y: [0, -6, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.span
                className="absolute -bottom-2 left-8 sm:left-12 w-1.5 h-1.5
                           rounded-full bg-[#CFEBFF]"
                animate={{ y: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
                transition={{
                  duration: 3.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
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