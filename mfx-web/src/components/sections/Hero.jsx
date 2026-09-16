import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShoppingCart,
  Gavel,
  Star,
  Shield,
  Zap,
  FileText,
  MessageCircle,
} from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left — content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
            >
              <Zap size={11} className="text-[#FFBE91]" />
              <span className="text-[10px] font-medium text-[#FFBE91] tracking-wide uppercase">
                Flip How You Buy
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight"
            >
              <span className="text-[#1A1A2E]">Market</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
                Flip
              </span>
              <br />
              <span className="text-[#1A1A2E] text-base md:text-lg lg:text-xl font-medium mt-2 block">
                Where buyers set the price.
              </span>
            </motion.h1>

            {/* Description with sequential word reveal */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="text-xs md:text-sm text-[#4A4A5A] max-w-lg leading-relaxed"
            >
              Post a <StreamWord word="Request" delay={0.6} /> start an{' '}
              <StreamWord word="Auction" delay={1.5} /> or just tell the{' '}
              <StreamWord word="AI" delay={2.4} /> what you need. Shops compete,
              you pick the best deal, and every handoff is verified.
            </motion.p>

            {/* Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <Button
                onClick={() => navigate('/auth')}
                className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white px-5 py-4 text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all group"
              >
                Get Started
                <ArrowRight className="ml-2 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  const el = document.getElementById('how-it-works');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="border-[#D0D0D0] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#1A1A2E] px-5 py-4 text-xs font-medium rounded-lg transition-all"
              >
                See How It Works
              </Button>
            </motion.div>

            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="flex items-center gap-4 pt-3"
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
                      delay: 0.6 + i * 0.06,
                      duration: 0.35,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={`w-7 h-7 rounded-full border-2 border-white bg-gradient-to-br ${item.color} flex items-center justify-center text-[#1A1A2E] shadow-sm`}
                  >
                    {item.icon}
                  </motion.div>
                ))}
              </div>
              <div>
                <p className="text-[11px] font-medium text-[#1A1A2E]">Trusted by 100+</p>
                <p className="text-[9px] text-[#A0A0B0]">Buyers and shops</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right — illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-sm aspect-square">
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFBE91]/15 via-[#FFDDB0]/10 to-[#CFEBFF]/15"
                animate={{ scale: [1, 1.04, 1], opacity: [0.85, 1, 0.85] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Center — shopping cart */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      delay: 0.4,
                      duration: 0.5,
                      type: 'spring',
                      stiffness: 300,
                    }}
                    className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center shadow-2xl"
                  >
                    <ShoppingCart size={26} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>

                  <motion.div
                    className="absolute -top-5 -right-5 w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-md"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <FileText size={15} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-5 -left-5 w-11 h-11 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-md"
                    animate={{ y: [0, 8, 0] }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.5,
                    }}
                  >
                    <Gavel size={15} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>

                  <motion.div
                    className="absolute -top-2 -left-8 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-sm"
                    animate={{ y: [0, -6, 0] }}
                    transition={{
                      duration: 2.5,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 1,
                    }}
                  >
                    <Star size={12} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>

                  <motion.div
                    className="absolute -bottom-2 -right-8 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-sm"
                    animate={{ y: [0, 6, 0] }}
                    transition={{
                      duration: 2.8,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: 0.8,
                    }}
                  >
                    <MessageCircle size={12} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>
                </div>
              </div>

              <motion.div
                className="absolute inset-0 rounded-full border border-[#FFBE91]/10"
                style={{ scale: 1.12 }}
                animate={{ scale: [1.12, 1.15, 1.12], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-[#CFEBFF]/10"
                style={{ scale: 1.25 }}
                animate={{ scale: [1.25, 1.29, 1.25], opacity: [0.5, 0.9, 0.5] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.5,
                }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border border-[#FFDDB0]/10"
                style={{ scale: 1.38 }}
                animate={{ scale: [1.38, 1.43, 1.38], opacity: [0.4, 0.8, 0.4] }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/**
 * A word that streams in character by character.
 * Sequential reveal — parent controls spacing between words via `delay`.
 */
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
          transition: {
            staggerChildren: 0.07,
            delayChildren: delay,
          },
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
              transition: {
                duration: 0.4,
                ease: [0.16, 1, 0.3, 1],
              },
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