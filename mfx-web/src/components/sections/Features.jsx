import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingBag, 
  Users, 
  TrendingUp, 
  Shield, 
  Clock, 
  Sparkles,
  ArrowRight
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
    <section id="features" className="relative py-20 px-4 overflow-hidden">
      {/* Section Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20">
            <span className="text-sm font-medium text-[#FFBE91]">✨ Features</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-[#1A1A2E]">Why Choose </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              MarketFlip
            </span>
            <span className="text-[#1A1A2E]">?</span>
          </h2>
          
          <p className="mt-4 text-lg text-[#4A4A5A] max-w-2xl mx-auto">
            Flip the way you shop. Let sellers compete for your business.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ 
                duration: 0.6, 
                delay: feature.delay,
                ease: "easeOut"
              }}
              viewport={{ once: true, margin: "-50px" }}
              whileHover={{ 
                y: -8,
                transition: { type: 'spring', stiffness: 300 }
              }}
              className="group relative bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#FFDDB0]/50 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7 text-[#1A1A2E]" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-[#1A1A2E] mb-3">
                {feature.title}
              </h3>
              <p className="text-[#4A4A5A] leading-relaxed">
                {feature.description}
              </p>

              {/* Hover Indicator */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="w-8 h-8 rounded-full bg-[#FFBE91]/10 flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-[#FFBE91]" />
                </div>
              </div>
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

export default Features;