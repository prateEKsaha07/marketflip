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
    id: 1,
    icon: ShoppingBag,
    title: 'Post Requests',
    description: 'Tell sellers exactly what you need and set your budget.',
    color: 'from-[#FFBE91] to-[#FFDDB0]',
    size: 'col-span-1',
    delay: 0.1,
    iconBg: 'bg-[#FFBE91]/20',
  },
  {
    id: 2,
    icon: Users,
    title: 'Sellers Compete',
    description: 'Shop owners bid with their best prices for your request.',
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    size: 'col-span-1',
    delay: 0.2,
    iconBg: 'bg-[#FFDDB0]/20',
  },
  {
    id: 3,
    icon: TrendingUp,
    title: 'Best Deal',
    description: 'Compare offers and choose the best fit for you.',
    color: 'from-[#CFEBFF] to-[#FFBE91]',
    size: 'col-span-1 md:col-span-1',
    delay: 0.3,
    iconBg: 'bg-[#CFEBFF]/20',
  },
  {
    id: 4,
    icon: Shield,
    title: 'Secure Contact',
    description: 'Contact details are revealed only after you select a bid.',
    color: 'from-[#FFBE91] to-[#CFEBFF]',
    size: 'col-span-1',
    delay: 0.4,
    iconBg: 'bg-[#FFBE91]/20',
  },
  {
    id: 5,
    icon: Clock,
    title: 'No More Hunting',
    description: 'Stop visiting shops one by one. Let sellers come to you.',
    color: 'from-[#FFDDB0] to-[#FFBE91]',
    size: 'col-span-1',
    delay: 0.5,
    iconBg: 'bg-[#FFDDB0]/20',
  },
  {
    id: 6,
    icon: Sparkles,
    title: 'Local Focus',
    description: 'Connect with trusted shop owners in your city.',
    color: 'from-[#CFEBFF] to-[#FFDDB0]',
    size: 'col-span-1',
    delay: 0.6,
    iconBg: 'bg-[#CFEBFF]/20',
  },
];

// Large featured feature
const featuredFeature = {
  icon: ShoppingBag,
  title: 'Post & Get Bids Instantly',
  description: 'Tell sellers what you need, set your budget, and receive multiple offers within hours. No more hunting around.',
  color: 'from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]',
  iconBg: 'bg-[#FFBE91]/20',
};

const BentoFeatures = () => {
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
          className="text-center mb-12"
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

        {/* Bento Grid - 2 columns on mobile, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Featured Card - spans 2 columns on desktop */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}
            className="relative md:col-span-2 bg-gradient-to-br from-[#FFBE91]/10 via-[#FFDDB0]/5 to-[#CFEBFF]/10 backdrop-blur-sm p-6 md:p-8 rounded-2xl border border-[#FFDDB0]/50 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden"
          >
            {/* Decorative background */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-[#FFBE91]/10 blur-2xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-[#CFEBFF]/10 blur-2xl" />
            
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center mb-4 shadow-md">
                  <featuredFeature.icon className="w-7 h-7 text-[#1A1A2E]" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#1A1A2E] mb-3">
                  {featuredFeature.title}
                </h3>
                <p className="text-[#4A4A5A] leading-relaxed max-w-lg">
                  {featuredFeature.description}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-2 text-[#FFBE91] font-medium group-hover:gap-3 transition-all">
                <span>Learn more</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </motion.div>

          {/* Regular Cards */}
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: feature.delay + 0.2 }}
              viewport={{ once: true }}
              whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300 } }}
              className={`relative bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-[#FFDDB0]/50 shadow-sm hover:shadow-xl transition-all duration-300 group ${feature.size}`}
            >
              {/* Decorative background */}
              <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full ${feature.iconBg} blur-xl`} />
              
              <div className="relative z-10 h-full flex flex-col">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-md group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-6 h-6 text-[#1A1A2E]" strokeWidth={1.5} />
                </div>
                <h4 className="text-lg font-semibold text-[#1A1A2E] mb-2">
                  {feature.title}
                </h4>
                <p className="text-sm text-[#4A4A5A] leading-relaxed flex-1">
                  {feature.description}
                </p>
                <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
          className="text-center mt-12"
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

export default BentoFeatures;