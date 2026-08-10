import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Sparkles, 
  ShoppingBag, 
  TrendingUp, 
  Star, 
  Users,
  Zap,
  Shield,
  Award,
  Circle,
  Activity
} from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-5"
          >
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
            >
              <Zap size={12} className="text-[#FFBE91]" />
              <span className="text-[10px] font-medium text-[#FFBE91] tracking-wide uppercase">Flip How You Buy</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
            >
              <span className="text-[#1A1A2E]">Market</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
                Flip
              </span>
              <br />
              <span className="text-[#1A1A2E] text-2xl md:text-3xl lg:text-4xl font-medium">
                Flip How You Buy.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-sm md:text-base text-[#4A4A5A] max-w-lg leading-relaxed"
            >
              Sellers compete for you. Post what you need, compare bids, and choose the best deal — without hunting shop to shop.
            </motion.p>

            {/* Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="flex flex-wrap gap-3 pt-2"
            >
              <Button className="bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white px-6 py-5 text-sm font-medium rounded-xl shadow-lg hover:shadow-xl transition-all group">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                className="border-[#D0D0D0] text-[#1A1A2E] hover:bg-[#F5F3EF] hover:border-[#1A1A2E] px-6 py-5 text-sm font-medium rounded-xl transition-all"
              >
                Learn More
              </Button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex items-center gap-5 pt-3"
            >
              <div className="flex items-center -space-x-2">
                {[
                  { icon: <Users size={12} />, color: 'from-[#FFBE91] to-[#FFDDB0]' },
                  { icon: <Award size={12} />, color: 'from-[#FFDDB0] to-[#CFEBFF]' },
                  { icon: <Shield size={12} />, color: 'from-[#CFEBFF] to-[#FFBE91]' },
                  { icon: <Activity size={12} />, color: 'from-[#FFBE91] to-[#CFEBFF]' },
                ].map((item, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full border-2 border-white bg-gradient-to-br ${item.color} flex items-center justify-center text-[#1A1A2E] shadow-sm`}
                  >
                    {item.icon}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-xs font-medium text-[#1A1A2E]">Trusted by 100+</p>
                <p className="text-[9px] text-[#A0A0B0]">Happy customers</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Content - Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              {/* Main Circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFBE91]/15 via-[#FFDDB0]/10 to-[#CFEBFF]/15 animate-pulse" />
              
              {/* Inner Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Center Icon */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 300 }}
                    className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center shadow-2xl"
                  >
                    <Sparkles size={28} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    className="absolute -top-6 -right-6 w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-md"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ShoppingBag size={18} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-6 -left-6 w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-md"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <TrendingUp size={18} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>
                  
                  <motion.div
                    className="absolute -top-3 -left-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-sm"
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <Star size={14} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-3 -right-10 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#EEECE6] flex items-center justify-center shadow-sm"
                    animate={{ y: [0, 6, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  >
                    <Zap size={14} className="text-[#1A1A2E]" strokeWidth={1.5} />
                  </motion.div>
                </div>
              </div>

              {/* Decorative Rings */}
              <div className="absolute inset-0 rounded-full border border-[#FFBE91]/10" style={{ transform: 'scale(1.12)' }} />
              <div className="absolute inset-0 rounded-full border border-[#CFEBFF]/10" style={{ transform: 'scale(1.25)' }} />
              <div className="absolute inset-0 rounded-full border border-[#FFDDB0]/10" style={{ transform: 'scale(1.38)' }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;