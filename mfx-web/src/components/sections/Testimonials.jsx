import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, MessageCircle, Users, Sparkles } from 'lucide-react';

const testimonials = [
  {
    name: 'Prateek Saha',
    role: 'Buyer',
    content: 'MarketFlip saved me hours of hunting. I got 5 bids within hours and saved ₹15,000 on my new laptop!',
    avatar: 'P',
    rating: 5,
    color: 'from-[#FFBE91] to-[#FFDDB0]',
    delay: 0,
  },
  {
    name: 'Tech Store',
    role: 'Shop Owner',
    content: 'I get new customers every week. Buyers come to me instead of me chasing them. Best decision ever!',
    avatar: 'T',
    rating: 5,
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    delay: 0.1,
  },
  {
    name: 'Riya Sharma',
    role: 'Buyer',
    content: 'Found exactly what I needed at the best price. Love the transparency and how easy it is to compare.',
    avatar: 'R',
    rating: 4,
    color: 'from-[#CFEBFF] to-[#FFBE91]',
    delay: 0.2,
  },
  {
    name: 'Sharma Electronics',
    role: 'Shop Owner',
    content: 'MarketFlip brought us 20+ new customers in just one month. Highly recommended for local shops!',
    avatar: 'S',
    rating: 5,
    color: 'from-[#FFBE91] to-[#CFEBFF]',
    delay: 0.3,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      ease: "easeOut",
      duration: 0.4,
    }
  }
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 30,
    scale: 0.96,
  },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 350,
      damping: 30,
      duration: 0.6,
    }
  }
};

const Testimonials = () => {
  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: "easeOut",
            delay: 0.1,
          }}
          viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-12"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4, ease: "easeOut" }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20"
          >
            <MessageCircle size={12} className="text-[#FFBE91]" />
            <span className="text-[10px] font-medium text-[#FFBE91] tracking-wide uppercase">Testimonials</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">What Our </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              Users Say
            </span>
          </h2>
          
          <p className="mt-2 text-sm text-[#4A4A5A] max-w-2xl mx-auto">
            Real stories from real people who flipped how they buy.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-2 gap-5"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ 
                y: -6,
                transition: { 
                  type: "spring", 
                  stiffness: 400, 
                  damping: 25 
                }
              }}
              className="group relative bg-white/70 backdrop-blur-sm p-6 rounded-xl border border-[#EEECE6] shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
                <Quote className="w-7 h-7 text-[#1A1A2E]" />
              </div>
              
              {/* Rating */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex gap-0.5 mb-3"
              >
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${
                      i < testimonial.rating 
                        ? 'text-[#FFBE91] fill-[#FFBE91]' 
                        : 'text-[#EEECE6]'
                    }`}
                  />
                ))}
              </motion.div>

              {/* Content */}
              <p className="text-sm text-[#1A1A2E] leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Avatar & Name */}
              <div className="flex items-center gap-3 mt-5">
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.4, type: "spring", stiffness: 300 }}
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-sm font-bold text-[#1A1A2E] shadow-sm flex-shrink-0`}
                >
                  {testimonial.avatar}
                </motion.div>
                <div>
                  <p className="text-sm font-semibold text-[#1A1A2E]">{testimonial.name}</p>
                  <p className="text-[10px] text-[#A0A0B0]">{testimonial.role}</p>
                </div>
              </div>

              {/* Subtle glow on hover */}
              <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${testimonial.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </motion.div>
          ))}
        </motion.div>

        {/* Trust Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
          viewport={{ once: true }}
          className="flex items-center justify-center gap-6 mt-10"
        >
          <div className="flex items-center gap-2 text-sm text-[#4A4A5A]">
            <Users size={14} className="text-[#FFBE91]" />
            <span>Trusted by 100+</span>
          </div>
          <div className="w-px h-5 bg-[#EEECE6]" />
          <div className="flex items-center gap-2 text-sm text-[#4A4A5A]">
            <Sparkles size={14} className="text-[#FFDDB0]" />
            <span>4.8 ★ Average Rating</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;