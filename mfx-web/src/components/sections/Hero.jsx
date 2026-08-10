import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20">
              <span className="text-sm font-medium text-[#FFBE91]">🚀 Flip How You Buy</span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              <span className="text-[#1A1A2E]">Market</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
                Flip
              </span>
              <br />
              <span className="text-[#1A1A2E] text-3xl md:text-4xl lg:text-5xl">
                Flip How You Buy.
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-[#4A4A5A] max-w-lg">
              Sellers compete for you. Post what you need, compare bids, and choose the best deal — without hunting shop to shop.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <Button className="bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E] px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all group">
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline" 
                className="border-2 border-[#FFDDB0] text-[#1A1A2E] hover:bg-[#FFDDB0]/20 px-8 py-6 text-lg rounded-xl"
              >
                Learn More
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center text-sm font-bold text-[#1A1A2E]"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">Trusted by 100+</p>
                <p className="text-xs text-[#4A4A5A]">Happy customers</p>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative flex justify-center"
          >
            <div className="relative w-full max-w-md aspect-square">
              {/* Main Circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FFBE91]/20 via-[#FFDDB0]/10 to-[#CFEBFF]/20 animate-pulse" />
              
              {/* Inner Elements */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {/* Center Icon */}
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FFBE91] to-[#FFDDB0] flex items-center justify-center shadow-2xl">
                    <span className="text-6xl">🔄</span>
                  </div>
                  
                  {/* Floating Elements */}
                  <motion.div
                    className="absolute -top-8 -right-8 w-16 h-16 rounded-full bg-[#CFEBFF] flex items-center justify-center shadow-lg"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <span className="text-2xl">🛒</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-8 -left-8 w-16 h-16 rounded-full bg-[#FFBE91] flex items-center justify-center shadow-lg"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <span className="text-2xl">💰</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -top-4 -left-12 w-12 h-12 rounded-full bg-[#FFDDB0] flex items-center justify-center shadow-md"
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  >
                    <span className="text-lg">🏪</span>
                  </motion.div>
                  
                  <motion.div
                    className="absolute -bottom-4 -right-12 w-12 h-12 rounded-full bg-[#CFEBFF] flex items-center justify-center shadow-md"
                    animate={{ y: [0, 8, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                  >
                    <span className="text-lg">⭐</span>
                  </motion.div>
                </div>
              </div>

              {/* Decorative Rings */}
              <div className="absolute inset-0 rounded-full border-2 border-[#FFBE91]/20" style={{ transform: 'scale(1.15)' }} />
              <div className="absolute inset-0 rounded-full border-2 border-[#CFEBFF]/20" style={{ transform: 'scale(1.3)' }} />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;