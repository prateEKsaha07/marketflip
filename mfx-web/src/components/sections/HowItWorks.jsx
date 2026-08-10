import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Shield,
  ArrowRight
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
    <section id="how-it-works" className="relative py-20 px-4 overflow-hidden">
      {/* Section Background */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-[#CFEBFF]/20 rounded-full border border-[#CFEBFF]/30">
            <span className="text-sm font-medium text-[#1A1A2E]">📋 How It Works</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-[#1A1A2E]">Get Started in </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              4 Simple Steps
            </span>
          </h2>
          
          <p className="mt-4 text-lg text-[#4A4A5A] max-w-2xl mx-auto">
            From posting a request to completing the deal — it's that easy.
          </p>
        </motion.div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: step.delay,
                ease: "easeOut"
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ 
                y: -8,
                transition: { type: 'spring', stiffness: 300 }
              }}
              className="group relative bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#FFDDB0]/50 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Step Number */}
              <div className="text-5xl font-bold text-[#FFBE91]/20 group-hover:text-[#FFBE91]/40 transition-colors duration-300 absolute top-4 right-4">
                {step.number}
              </div>

              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <step.icon className="w-7 h-7 text-[#1A1A2E]" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">
                {step.title}
              </h3>
              <p className="text-[#4A4A5A] leading-relaxed">
                {step.description}
              </p>

              {/* Connector Line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2">
                  <ArrowRight className="w-6 h-6 text-[#FFBE91]/30" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <p className="text-[#4A4A5A] mb-4">
            Ready to flip how you buy?
          </p>
          <Button className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group">
            Get Started
            <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;