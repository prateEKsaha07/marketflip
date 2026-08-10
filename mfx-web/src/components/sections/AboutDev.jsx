import React from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  Code,
  Sparkles,
  Users,
  Briefcase,
  MapPin,
  Mail,
  ArrowUpRight
} from 'lucide-react';

const AboutDev = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        ease: "easeOut",
        duration: 0.4,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15, scale: 0.95 },
    show: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 350,
        damping: 30,
        duration: 0.5,
      }
    }
  };

  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="text-center"
        >
          {/* Badge */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
          >
            <User size={12} className="text-[#FFBE91]" />
            <span className="text-[10px] font-medium text-[#FFBE91] tracking-wide uppercase">About</span>
          </motion.div>
          
          <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Meet the </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              Developer
            </span>
          </motion.h2>
          
          {/* Avatar */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="mt-8 w-20 h-20 rounded-full bg-gradient-to-br from-[#FFBE91] to-[#CFEBFF] flex items-center justify-center text-2xl font-bold text-[#1A1A2E] shadow-lg mx-auto"
          >
            PS
          </motion.div>

          {/* Name */}
          <motion.h3 variants={itemVariants} className="mt-4 text-xl font-bold text-[#1A1A2E]">
            Prateek Saha
          </motion.h3>
          <motion.p variants={itemVariants} className="text-sm text-[#4A4A5A]">
            Full Stack Developer
          </motion.p>

          {/* Bio */}
          <motion.p variants={itemVariants} className="mt-4 max-w-2xl mx-auto text-sm text-[#4A4A5A] leading-relaxed">
            Building MarketFlip with a vision to revolutionize local commerce. 
            Passionate about creating solutions that make everyday life simpler, 
            fairer, and more connected.
          </motion.p>

          {/* Tech Stack */}
          <motion.div 
            variants={itemVariants}
            className="mt-5 flex flex-wrap gap-1.5 justify-center"
          >
            {['React', 'FastAPI', 'Supabase', 'Framer Motion', 'Tailwind CSS', 'shadcn/ui'].map((tech) => (
              <span
                key={tech}
                className="px-2.5 py-0.5 bg-[#F8F6F0] text-[#1A1A2E] text-[10px] rounded-full border border-[#EEECE6]"
              >
                {tech}
              </span>
            ))}
          </motion.div>

          {/* Social Links - Text based (No icons) */}
          <motion.div 
            variants={itemVariants}
            className="mt-6 flex flex-wrap gap-3 justify-center"
          >
            {['GitHub', 'LinkedIn', 'Twitter', 'Email'].map((social, index) => (
              <motion.a
                key={index}
                href={social === 'Email' ? 'mailto:prateek@marketflip.com' : '#'}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className="px-4 py-1.5 text-[10px] font-medium text-[#1A1A2E] bg-white/80 backdrop-blur-sm border border-[#EEECE6] rounded-full hover:bg-[#FFBE91]/10 hover:border-[#FFBE91] transition-all"
              >
                {social}
              </motion.a>
            ))}
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={itemVariants}
            className="mt-6 flex items-center justify-center gap-6 text-xs text-[#4A4A5A]"
          >
            <div className="flex items-center gap-1.5">
              <Code size={13} className="text-[#FFBE91]" />
              <span>2+ Years</span>
            </div>
            <div className="w-px h-4 bg-[#EEECE6]" />
            <div className="flex items-center gap-1.5">
              <Briefcase size={13} className="text-[#FFDDB0]" />
              <span>3 Projects</span>
            </div>
            <div className="w-px h-4 bg-[#EEECE6]" />
            <div className="flex items-center gap-1.5">
              <Users size={13} className="text-[#CFEBFF]" />
              <span>100+ Users</span>
            </div>
          </motion.div>

          {/* Location & Email */}
          <motion.div 
            variants={itemVariants}
            className="mt-5 flex flex-wrap items-center justify-center gap-4 text-xs text-[#A0A0B0]"
          >
            <div className="flex items-center gap-1.5">
              <MapPin size={13} />
              <span>Bhilai, India</span>
            </div>
            <div className="w-px h-3 bg-[#EEECE6]" />
            <div className="flex items-center gap-1.5">
              <Mail size={13} />
              <span>prateek@marketflip.com</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutDev;