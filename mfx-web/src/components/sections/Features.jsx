import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  Sparkles,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: ShoppingBag,
    title: 'Post Requests',
    description: 'Tell sellers exactly what you need, set your budget, and let the best offers come to you.',
    color: 'from-[#FFBE91] to-[#FFDDB0]',
    delay: 0.1,
  },
  {
    icon: Users,
    title: 'Sellers Compete',
    description: 'Shop owners bid with their best prices. You get multiple offers to choose from.',
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    delay: 0.2,
  },
  {
    icon: TrendingUp,
    title: 'Best Deal',
    description: 'Compare bids, check shop profiles, and pick the offer that fits you best.',
    color: 'from-[#CFEBFF] to-[#FFBE91]',
    delay: 0.3,
  },
  {
    icon: Shield,
    title: 'Secure Contact',
    description: 'Contact details are revealed only after you select a bid — your privacy is protected.',
    color: 'from-[#FFBE91] to-[#CFEBFF]',
    delay: 0.4,
  },
  {
    icon: Clock,
    title: 'No More Hunting',
    description: 'Stop visiting shops one by one. Let sellers come to you with their best prices.',
    color: 'from-[#FFDDB0] to-[#FFBE91]',
    delay: 0.5,
  },
  {
    icon: Sparkles,
    title: 'Local Focus',
    description: 'Connect with trusted shop owners in your city. Support local businesses.',
    color: 'from-[#CFEBFF] to-[#FFDDB0]',
    delay: 0.6,
  },
];

const Features = () => {
  return (
    <section id="features" className="relative py-12 md:py-16 px-4 overflow-hidden">
      {/* Section Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-8"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
          >
            <Zap size={10} className="text-[#FFBE91]" />
            <span className="text-[9px] font-medium text-[#FFBE91] tracking-wide uppercase">Features</span>
          </motion.div>
          
          <h2 className="text-2xl md:text-3xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Why Choose </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              MarketFlip
            </span>
            <span className="text-[#1A1A2E]">?</span>
          </h2>
          
          <p className="mt-1.5 text-xs text-[#4A4A5A] max-w-2xl mx-auto">
            Flip the way you shop. Let sellers compete for your business.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.4, 
                delay: feature.delay,
                ease: "easeOut"
              }}
              viewport={{ once: true, margin: "-30px" }}
              whileHover={{ 
                y: -4,
                transition: { type: 'spring', stiffness: 400, damping: 25 }
              }}
              className="group relative bg-white/60 backdrop-blur-sm p-4 rounded-lg border border-[#EEECE6] shadow-sm hover:shadow-md transition-all duration-300"
            >
              {/* Icon */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ delay: feature.delay + 0.1, duration: 0.3 }}
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-sm group-hover:scale-110 transition-transform duration-300`}
              >
                <feature.icon className="w-4.5 h-4.5 text-[#1A1A2E]" strokeWidth={1.5} />
              </motion.div>

              {/* Content */}
              <h3 className="text-sm font-semibold text-[#1A1A2E] mb-1.5">
                {feature.title}
              </h3>
              <p className="text-xs text-[#4A4A5A] leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Indicator */}
              <motion.div 
                initial={{ opacity: 0, x: -4 }}
                whileHover={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute bottom-3 right-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#F5F3EF] flex items-center justify-center group-hover:bg-[#FFBE91]/10 transition-colors">
                  <ArrowRight className="w-3 h-3 text-[#A0A0B0] group-hover:text-[#FFBE91] transition-colors" />
                </div>
              </motion.div>

              {/* Subtle glow on hover */}
              <div className={`absolute inset-0 rounded-lg bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-xs text-[#4A4A5A] mb-2.5">
            Ready to flip how you buy?
          </p>
          <Button className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white px-5 py-3.5 text-xs font-medium rounded-lg shadow-md hover:shadow-lg transition-all group">
            Get Started
            <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;