import React from 'react';
import { motion } from 'framer-motion';

const AboutDev = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20">
            <span className="text-sm font-medium text-[#FFBE91]">👨‍💻 About</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-[#1A1A2E]">Meet the </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              Developer
            </span>
          </h2>
          
          <div className="mt-8 flex flex-col items-center">
            {/* Avatar */}
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FFBE91] to-[#CFEBFF] flex items-center justify-center text-3xl font-bold text-[#1A1A2E] shadow-lg"
            >
              PS
            </motion.div>

            {/* Name */}
            <h3 className="mt-4 text-2xl font-bold text-[#1A1A2E]">Prateek Saha</h3>
            <p className="text-[#4A4A5A]">Full Stack Developer</p>

            {/* Bio */}
            <p className="mt-4 max-w-2xl text-[#4A4A5A] leading-relaxed">
              Building MarketFlip with a vision to revolutionize local commerce. 
              Passionate about creating solutions that make everyday life simpler, 
              fairer, and more connected.
            </p>

            {/* Tech Stack */}
            <div className="mt-6 flex flex-wrap gap-2 justify-center">
              {['React', 'FastAPI', 'Supabase', 'Framer Motion', 'Tailwind CSS', 'shadcn/ui'].map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 bg-[#FFDDB0]/30 text-[#1A1A2E] text-sm rounded-full border border-[#FFDDB0]/50"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              <motion.a
                href="#"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm border border-[#FFDDB0]/50 flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm text-xl"
                aria-label="GitHub"
              >
                🐙
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm border border-[#FFDDB0]/50 flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm text-xl"
                aria-label="LinkedIn"
              >
                💼
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm border border-[#FFDDB0]/50 flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm text-xl"
                aria-label="Twitter"
              >
                🐦
              </motion.a>
              <motion.a
                href="mailto:prateek@marketflip.com"
                whileHover={{ y: -3, scale: 1.05 }}
                transition={{ type: 'spring', stiffness: 300 }}
                className="w-12 h-12 rounded-full bg-white/60 backdrop-blur-sm border border-[#FFDDB0]/50 flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm text-xl"
                aria-label="Email"
              >
                ✉️
              </motion.a>
            </div>

            {/* Footer Text */}
            <div className="mt-8 flex items-center gap-2 text-sm text-[#4A4A5A]">
              <span className="text-lg">📍</span>
              <span>Bhilai, India</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutDev;