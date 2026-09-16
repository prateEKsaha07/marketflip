import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, MessageCircle, Users, Sparkles } from 'lucide-react';

const testimonials = [
  {
    name: 'Prateek Saha',
    role: 'Buyer',
    content: 'MarketFlip saved me hours. Got 5 bids in hours and saved ₹15,000.',
    avatar: 'P',
    rating: 5,
    color: 'from-[#FFBE91] to-[#FFDDB0]',
    floatDelay: 0,
  },
  {
    name: 'Tech Store',
    role: 'Shop Owner',
    content: 'New customers every week. Buyers come to me now, not the other way.',
    avatar: 'T',
    rating: 5,
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    floatDelay: 0.6,
  },
  {
    name: 'Riya Sharma',
    role: 'Buyer',
    content: 'Found exactly what I needed. Love the transparency.',
    avatar: 'R',
    rating: 4,
    color: 'from-[#CFEBFF] to-[#FFBE91]',
    floatDelay: 1.2,
  },
  {
    name: 'Sharma Electronics',
    role: 'Shop Owner',
    content: '20+ new customers in one month. Recommended for local shops.',
    avatar: 'S',
    rating: 5,
    color: 'from-[#FFBE91] to-[#CFEBFF]',
    floatDelay: 1.8,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, ease: [0.16, 1, 0.3, 1] },
  },
};

const Testimonials = () => {
  return (
    <section className="relative py-12 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center mb-6"
        >
          <div className="inline-flex items-center gap-1 px-2 py-0.5 mb-2 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20">
            <MessageCircle size={9} className="text-[#FFBE91]" />
            <span className="text-[8px] font-medium text-[#FFBE91] tracking-wide uppercase">
              Testimonials
            </span>
          </div>

          <h2 className="text-lg md:text-xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">What our </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              users say
            </span>
          </h2>
        </motion.div>

        {/* Testimonials grid — auto rows so cards don't stretch */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-50px' }}
          className="grid grid-cols-2 gap-2 auto-rows-min"
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{
                y: -2,
                transition: { type: 'spring', stiffness: 400, damping: 25 },
              }}
              className="group relative bg-white/70 backdrop-blur-sm p-2 rounded-md border border-[#EEECE6] shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden"
            >
              {/* Idle floating blob */}
              <motion.div
                aria-hidden="true"
                className={`absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} blur-2xl`}
                animate={{
                  y: [0, -3, 0],
                  x: [0, 2, 0],
                  opacity: [0.14, 0.24, 0.14],
                }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: testimonial.floatDelay,
                }}
              />

              {/* Quote icon */}
              <div className="absolute top-1.5 right-2 opacity-10 group-hover:opacity-25 transition-opacity duration-300">
                <Quote className="w-3 h-3 text-[#1A1A2E]" />
              </div>

              {/* Rating */}
              <div className="relative flex gap-0.5 mb-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-1.5 h-1.5 ${
                      i < testimonial.rating
                        ? 'text-[#FFBE91] fill-[#FFBE91]'
                        : 'text-[#EEECE6]'
                    }`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="relative text-[10px] text-[#1A1A2E] leading-snug italic pr-3">
                "{testimonial.content}"
              </p>

              {/* Avatar & name — inline compact */}
              <div className="relative flex items-center gap-1.5 mt-1.5">
                <div
                  className={`w-4 h-4 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-[7px] font-bold text-[#1A1A2E] shadow-sm flex-shrink-0`}
                >
                  {testimonial.avatar}
                </div>
                <p className="text-[8px] font-semibold text-[#1A1A2E] leading-tight truncate">
                  {testimonial.name}
                  <span className="text-[#A0A0B0] font-normal"> · {testimonial.role}</span>
                </p>
              </div>

              {/* Hover glow */}
              <div
                className={`absolute inset-0 rounded-md bg-gradient-to-br ${testimonial.color} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-300 pointer-events-none`}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-2 mt-6"
        >
          <div className="flex items-center gap-1 text-[9px] text-[#4A4A5A]">
            <Users size={9} className="text-[#FFBE91]" />
            <span>Trusted by 100+</span>
          </div>
          <div className="w-px h-2.5 bg-[#EEECE6]" />
          <div className="flex items-center gap-1 text-[9px] text-[#4A4A5A]">
            <Sparkles size={9} className="text-[#FFDDB0]" />
            <span>4.8 ★ Average Rating</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Testimonials;