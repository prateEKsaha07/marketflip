import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Gavel,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
  MessageCircle,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    id: 1,
    icon: FileText,
    title: 'Post Requests',
    description: 'Describe what you need. Set your budget. Shops come to you.',
    color: 'from-[#FFBE91] to-[#FFDDB0]',
    iconBg: 'bg-[#FFBE91]/20',
  },
  {
    id: 2,
    icon: Gavel,
    title: 'Live Auctions',
    description: 'Run or join timed auctions. Highest bid wins, fairly.',
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    iconBg: 'bg-[#FFDDB0]/20',
  },
  {
    id: 3,
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Just describe what you want. We turn it into a request.',
    color: 'from-[#CFEBFF] to-[#FFBE91]',
    iconBg: 'bg-[#CFEBFF]/20',
  },
  {
    id: 4,
    icon: Shield,
    title: 'Verified Handoff',
    description: 'OTP-verified delivery. Contact revealed only after you choose.',
    color: 'from-[#FFBE91] to-[#CFEBFF]',
    iconBg: 'bg-[#FFBE91]/20',
  },
  {
    id: 5,
    icon: TrendingUp,
    title: 'Shop Reliability',
    description: 'Every shop carries a score based on real completed deals.',
    color: 'from-[#FFDDB0] to-[#FFBE91]',
    iconBg: 'bg-[#FFDDB0]/20',
  },
  {
    id: 6,
    icon: Users,
    title: 'Local First',
    description: 'Connect with verified shops in your city and pincode.',
    color: 'from-[#CFEBFF] to-[#FFDDB0]',
    iconBg: 'bg-[#CFEBFF]/20',
  },
  {
    id: 7,
    icon: MessageCircle,
    title: 'In-App Chat',
    description: 'Negotiate, share details, and coordinate directly — safely.',
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    iconBg: 'bg-[#FFDDB0]/20',
  },
];

const featuredFeature = {
  icon: Sparkles,
  title: 'Flip the way you shop',
  description:
    'Post a request or start an auction in seconds — or just tell the AI what you need. Sellers compete, you choose, and every handoff is verified end to end.',
};

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

const BentoFeatures = () => {
  const navigate = useNavigate();

  return (
    <section id="features" className="relative py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-80px' }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-3 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
          >
            <span className="text-xs font-medium text-[#FFBE91]">What's inside</span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Built for how </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              you actually buy
            </span>
          </h2>

          <p className="mt-3 text-sm text-[#4A4A5A] max-w-xl mx-auto">
            Requests, auctions, AI, and verified handoffs — in one place.
          </p>
        </motion.div>

        {/* Bento grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-3 gap-3"
        >
          {/* Featured card */}
          <motion.div
            variants={cardVariants}
            whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
            className="relative md:col-span-2 bg-gradient-to-br from-[#FFBE91]/10 via-[#FFDDB0]/5 to-[#CFEBFF]/10 backdrop-blur-sm px-5 py-5 rounded-xl border border-[#FFDDB0]/50 shadow-sm hover:shadow-lg transition-shadow duration-300 group overflow-hidden"
          >
            <motion.div
              className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#FFBE91]/15 blur-2xl"
              animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#CFEBFF]/15 blur-2xl"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-start gap-3">
                <motion.div
                  whileHover={{ rotate: 8, scale: 1.05 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center shadow-sm flex-shrink-0"
                >
                  <featuredFeature.icon className="w-5 h-5 text-[#1A1A2E]" strokeWidth={1.5} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base md:text-lg font-bold text-[#1A1A2E] mb-1">
                    {featuredFeature.title}
                  </h3>
                  <p className="text-xs md:text-sm text-[#4A4A5A] leading-relaxed">
                    {featuredFeature.description}
                  </p>
                </div>
              </div>

              <motion.button
                onClick={() => navigate('/auth')}
                whileHover={{ x: 3 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[#FFBE91] w-fit"
              >
                <span>Get started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </motion.button>
            </div>
          </motion.div>

          {/* Regular cards */}
          {features.map((feature) => (
            <motion.div
              key={feature.id}
              variants={cardVariants}
              whileHover={{ y: -3, transition: { type: 'spring', stiffness: 400, damping: 25 } }}
              className="relative bg-white/60 backdrop-blur-sm px-4 py-4 rounded-xl border border-[#FFDDB0]/50 shadow-sm hover:shadow-lg transition-shadow duration-300 group overflow-hidden"
            >
              <div className={`absolute -top-8 -right-8 w-20 h-20 rounded-full ${feature.iconBg} blur-xl opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

              <div className="relative z-10 flex items-start gap-3">
                <motion.div
                  whileHover={{ rotate: -6, scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={`w-9 h-9 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center shadow-sm flex-shrink-0`}
                >
                  <feature.icon className="w-4.5 h-4.5 text-[#1A1A2E]" strokeWidth={1.5} />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-[#1A1A2E] mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-[#4A4A5A] leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <p className="text-xs text-[#4A4A5A] mb-3">
            Ready to flip how you buy?
          </p>
          <Button
            onClick={() => navigate('/auth')}
            className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] px-6 py-4 text-sm rounded-lg shadow-md hover:shadow-lg transition-all group"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default BentoFeatures;