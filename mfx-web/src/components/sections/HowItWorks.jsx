import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Users,
  TrendingUp,
  Shield,
  ArrowRight,
  ListChecks,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: FileText,
    title: 'Post or Start',
    description: 'Post a request, kick off an auction, or ask the AI — whatever fits.',
    color: 'from-[#FFBE91] to-[#FFDDB0]',
  },
  {
    number: '02',
    icon: Users,
    title: 'Sellers Compete',
    description: 'Nearby shops see it and send their best prices and notes.',
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Compare & Pick',
    description: 'Review offers, check reliability scores, and choose the best fit.',
    color: 'from-[#CFEBFF] to-[#FFBE91]',
  },
  {
    number: '04',
    icon: Shield,
    title: 'Verified Handoff',
    description: 'Contact is revealed, delivery is arranged, OTP confirms completion.',
    color: 'from-[#FFBE91] to-[#CFEBFF]',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
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

const HowItWorks = () => {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className="relative py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />

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
            transition={{ delay: 0.1, duration: 0.4 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-[#CFEBFF]/20 rounded-full border border-[#CFEBFF]/30"
          >
            <ListChecks size={11} className="text-[#1A1A2E]" />
            <span className="text-[10px] font-medium text-[#1A1A2E] tracking-wide uppercase">
              How it works
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Get started in </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              4 simple steps
            </span>
          </h2>

          <p className="mt-3 text-sm text-[#4A4A5A] max-w-xl mx-auto">
            From posting to a verified handoff — it's that easy.
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3"
        >
          {steps.map((step) => (
            <motion.div
              key={step.number}
              variants={cardVariants}
              whileHover={{
                y: -4,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }}
              className="group relative bg-white/60 backdrop-blur-sm px-4 py-4 rounded-xl border border-[#EEECE6] shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden"
            >
              {/* Step number */}
              <div className="absolute top-3 right-4 text-3xl font-bold text-[#FFBE91]/15 group-hover:text-[#FFBE91]/35 transition-colors duration-300 select-none">
                {step.number}
              </div>

              {/* Icon */}
              <motion.div
                whileHover={{ rotate: -6, scale: 1.08 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${step.color} flex items-center justify-center mb-3 shadow-sm`}
              >
                <step.icon className="w-4.5 h-4.5 text-[#1A1A2E]" strokeWidth={1.5} />
              </motion.div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-1.5">
                {step.title}
              </h3>
              <p className="text-xs text-[#4A4A5A] leading-relaxed">
                {step.description}
              </p>

              {/* Hover glow */}
              <div
                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none`}
              />
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
            className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white px-6 py-4 text-sm font-medium rounded-lg shadow-md hover:shadow-lg transition-all group"
          >
            Get Started
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;