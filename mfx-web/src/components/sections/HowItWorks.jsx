import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Shield,
  ArrowRight,
  ListChecks
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  {
    number: '01',
    icon: ShoppingBag,
    title: 'Post Your Request',
    description: 'Tell sellers what you need, set your budget, and specify your location.',
    color: 'from-[#FFBE91] to-[#FFDDB0]',
    delay: 0.1,
  },
  {
    number: '02',
    icon: Users,
    title: 'Sellers Bid',
    description: 'Shop owners see your request and submit their best offers with prices and notes.',
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    delay: 0.2,
  },
  {
    number: '03',
    icon: TrendingUp,
    title: 'Compare & Select',
    description: 'Review all bids, compare shop profiles, and choose the best deal for you.',
    color: 'from-[#CFEBFF] to-[#FFBE91]',
    delay: 0.3,
  },
  {
    number: '04',
    icon: Shield,
    title: 'Connect & Complete',
    description: 'Contact details are revealed, delivery is arranged, and the transaction is completed.',
    color: 'from-[#FFBE91] to-[#CFEBFF]',
    delay: 0.4,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="relative py-16 md:py-20 px-4 overflow-hidden">
      {/* Section Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true, margin: "-80px" }}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-[#CFEBFF]/20 rounded-full border border-[#CFEBFF]/30"
          >
            <ListChecks size={12} className="text-[#1A1A2E]" />
            <span className="text-[10px] font-medium text-[#1A1A2E] tracking-wide uppercase">How It Works</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Get Started in </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              4 Simple Steps
            </span>
          </h2>
          
          <p className="mt-2 text-sm text-[#4A4A5A] max-w-2xl mx-auto">
            From posting a request to completing the deal — it's that easy.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.5, 
                delay: step.delay,
                ease: "easeOut"
              }}
              viewport={{ once: true, margin: "-40px" }}
              whileHover={{ 
                y: -6,
                transition: { type: 'spring', stiffness: 400, damping: 25 }
              }}
              className="group relative bg-white/60 backdrop-blur-sm p-6 rounded-xl border border-[#EEECE6] shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Step Number */}
              <div className="text-4xl font-bold text-[#FFBE91]/20 group-hover:text-[#FFBE91]/40 transition-colors duration-300 absolute top-3 right-4">
                {step.number}
              </div>

              {/* Icon */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: step.delay + 0.1, duration: 0.4 }}
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300`}
              >
                <step.icon className="w-6 h-6 text-[#1A1A2E]" strokeWidth={1.5} />
              </motion.div>

              {/* Content */}
              <h3 className="text-base font-semibold text-[#1A1A2E] mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-[#4A4A5A] leading-relaxed">
                {step.description}
              </p>

              {/* Subtle glow on hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-sm text-[#4A4A5A] mb-3">
            Ready to flip how you buy?
          </p>
          <Button className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white px-6 py-5 text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all group">
            Get Started
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;