import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Prateek Saha',
    role: 'Buyer',
    content: 'MarketFlip saved me hours of hunting. I got 5 bids within hours and saved ₹15,000 on my new laptop!',
    avatar: 'P',
    rating: 5,
    color: 'from-[#FFBE91] to-[#FFDDB0]',
  },
  {
    name: 'Tech Store',
    role: 'Shop Owner',
    content: 'I get new customers every week. Buyers come to me instead of me chasing them. Best decision ever!',
    avatar: 'T',
    rating: 5,
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
  },
  {
    name: 'Riya Sharma',
    role: 'Buyer',
    content: 'Found exactly what I needed at the best price. Love the transparency and how easy it is to compare.',
    avatar: 'R',
    rating: 4,
    color: 'from-[#CFEBFF] to-[#FFBE91]',
  },
  {
    name: 'Sharma Electronics',
    role: 'Shop Owner',
    content: 'MarketFlip brought us 20+ new customers in just one month. Highly recommended for local shops!',
    avatar: 'S',
    rating: 5,
    color: 'from-[#FFBE91] to-[#CFEBFF]',
  },
];

const Testimonials = () => {
  return (
    <section className="relative py-20 px-4 overflow-hidden">
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
            <span className="text-sm font-medium text-[#FFBE91]">💬 Testimonials</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-[#1A1A2E]">What Our </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              Users Say
            </span>
          </h2>
          
          <p className="mt-4 text-lg text-[#4A4A5A] max-w-2xl mx-auto">
            Real stories from real people who flipped how they buy.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -8, transition: { type: 'spring', stiffness: 300 } }}
              className="group relative bg-white/60 backdrop-blur-sm p-8 rounded-2xl border border-[#FFDDB0]/50 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {/* Quote Icon */}
              <Quote className="absolute top-4 right-4 w-8 h-8 text-[#FFBE91]/20 group-hover:text-[#FFBE91]/40 transition-colors" />
              
              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < testimonial.rating ? 'text-[#FFBE91] fill-[#FFBE91]' : 'text-gray-300'}`}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-[#1A1A2E] leading-relaxed italic">
                "{testimonial.content}"
              </p>

              {/* Avatar & Name */}
              <div className="flex items-center gap-4 mt-6">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center text-lg font-bold text-[#1A1A2E]`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <p className="font-semibold text-[#1A1A2E]">{testimonial.name}</p>
                  <p className="text-sm text-[#4A4A5A]">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;