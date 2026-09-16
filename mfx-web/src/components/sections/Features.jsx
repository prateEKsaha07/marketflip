import React from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Gavel,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const features = [
  {
    icon: FileText,
    title: 'Post Requests',
    description: 'Describe what you need, set your budget, let the best offers come to you.',
    color: 'from-[#FFBE91] to-[#FFDDB0]',
  },
  {
    icon: Gavel,
    title: 'Live Auctions',
    description: 'Run or join timed auctions. Highest bid wins, fairly.',
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
  },
  {
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Just describe what you want. We turn it into a request.',
    color: 'from-[#CFEBFF] to-[#FFBE91]',
  },
  {
    icon: Shield,
    title: 'Verified Handoff',
    description: 'OTP-verified delivery. Contact revealed only after you choose.',
    color: 'from-[#FFBE91] to-[#CFEBFF]',
  },
  {
    icon: TrendingUp,
    title: 'Shop Reliability',
    description: 'Every shop carries a score based on real completed deals.',
    color: 'from-[#FFDDB0] to-[#FFBE91]',
  },
  {
    icon: Users,
    title: 'Local First',
    description: 'Connect with verified shops in your city and pincode.',
    color: 'from-[#CFEBFF] to-[#FFDDB0]',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};

const Features = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="relative py-14 md:py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
          >
            <Zap size={10} className="text-[#FFBE91]" />
            <span className="text-[9px] font-medium text-[#FFBE91] tracking-wide uppercase">
              What's inside
            </span>
          </motion.div>

          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Built for how </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              you actually buy
            </span>
          </h2>

          <p className="mt-2 text-xs text-[#4A4A5A] max-w-xl mx-auto">
            Requests, auctions, AI, and verified handoffs — in one place.
          </p>
        </motion.div>

        {/* Features grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              whileHover={{
                y: -4,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }}
              className="group relative bg-white/60 backdrop-blur-sm px-4 py-4 rounded-lg border border-[#EEECE6] shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
            >
              {/* Icon with subtle idle pulse */}
              <motion.div
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(255,190,145,0)',
                    '0 0 0 6px rgba(255,190,145,0.06)',
                    '0 0 0 0 rgba(255,190,145,0)',
                  ],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className={`relative w-9 h-9 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-4 h-4 text-[#1A1A2E]" strokeWidth={1.5} />
              </motion.div>

              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs text-[#4A4A5A] leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow */}
              <div
                className={`absolute inset-0 rounded-lg bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-[0.05] transition-opacity duration-300 pointer-events-none`}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-xs text-[#4A4A5A] mb-2.5">
            Ready to flip how you buy?
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white px-5 py-3.5 text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all group"
          >
            Get Started
            <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;