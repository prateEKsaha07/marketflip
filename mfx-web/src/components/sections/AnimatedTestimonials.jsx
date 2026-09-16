import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: 'Prateek Saha',
    role: 'Buyer',
    content: 'MarketFlip saved me hours of hunting. I got 5 bids within hours and saved ₹15,000 on my new laptop!',
    avatar: 'PS',
    rating: 5,
    color: 'from-[#FFBE91] to-[#FFDDB0]',
    borderColor: 'border-[#FFBE91]/30',
  },
  {
    id: 2,
    name: 'Tech Store',
    role: 'Shop Owner',
    content: 'I get new customers every week. Buyers come to me instead of me chasing them. Best decision ever!',
    avatar: 'TS',
    rating: 5,
    color: 'from-[#FFDDB0] to-[#CFEBFF]',
    borderColor: 'border-[#FFDDB0]/30',
  },
  {
    id: 3,
    name: 'Riya Sharma',
    role: 'Buyer',
    content: 'Found exactly what I needed at the best price. Love the transparency and how easy it is to compare.',
    avatar: 'RS',
    rating: 4,
    color: 'from-[#CFEBFF] to-[#FFBE91]',
    borderColor: 'border-[#CFEBFF]/30',
  },
  {
    id: 4,
    name: 'Sharma Electronics',
    role: 'Shop Owner',
    content: 'MarketFlip brought us 20+ new customers in just one month. Highly recommended for local shops!',
    avatar: 'SE',
    rating: 5,
    color: 'from-[#FFBE91] to-[#CFEBFF]',
    borderColor: 'border-[#FFBE91]/30',
  },
  {
    id: 5,
    name: 'Ananya Singh',
    role: 'Buyer',
    content: 'The best part? I didn\'t have to haggle. Shop owners gave me their best price upfront. Game changer!',
    avatar: 'AS',
    rating: 5,
    color: 'from-[#FFDDB0] to-[#FFBE91]',
    borderColor: 'border-[#FFDDB0]/30',
  },
];

const AnimatedTestimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const totalSlides = testimonials.length;
  const visibleCount = 3;

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (isHovering) return;

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovering, totalSlides]);

  const goToSlide = (index) => setCurrentIndex(index);
  const nextSlide = () => setCurrentIndex((prev) => (prev + 1) % totalSlides);
  const prevSlide = () =>
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchMove = (e) => setTouchEnd(e.touches[0].clientX);
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) nextSlide();
    if (distance < -50) prevSlide();
    setTouchStart(null);
    setTouchEnd(null);
  };

  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % totalSlides;
      result.push({
        ...testimonials[index],
        position: i === 1 ? 'center' : i === 0 ? 'left' : 'right',
        index,
      });
    }
    return result;
  };

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section id="testimonials" className="relative py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />

      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-3 bg-[#FFBE91]/10 rounded-full border border-[#FFBE91]/20">
            <span className="text-[11px] font-medium text-[#FFBE91] tracking-wide uppercase">
              Testimonials
            </span>
          </div>

          <h2 className="text-3xl md:text-4xl font-bold">
            <span className="text-[#1A1A2E]">What our </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              users say
            </span>
          </h2>

          <p className="mt-3 text-sm text-[#4A4A5A] max-w-xl mx-auto">
            Real stories from real people who flipped how they buy.
          </p>
        </motion.div>

        {/* Carousel */}
        <div
          className="relative max-w-4xl mx-auto"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="absolute -top-20 -left-20 w-56 h-56 bg-[#FFBE91]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-[#CFEBFF]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative min-h-[300px]">
            {visibleTestimonials.map((item, idx) => {
              const isCenter = idx === 1;
              const isLeft = idx === 0;
              const isRight = idx === 2;

              return (
                <motion.div
                  key={`${item.id}-${currentIndex}`}
                  initial={{ opacity: 0, scale: isCenter ? 0.9 : 0.7, y: 20 }}
                  animate={{
                    opacity: 1,
                    scale: isCenter ? 1 : 0.9,
                    y: isCenter ? 0 : 14,
                  }}
                  exit={{ opacity: 0, scale: isCenter ? 0.9 : 0.7, y: -20 }}
                  transition={{
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 300,
                    damping: 25,
                  }}
                  whileHover={isCenter ? { y: -6 } : {}}
                  className={`relative group cursor-pointer ${
                    isCenter ? 'z-20' : 'z-10'
                  } ${isLeft ? 'md:-translate-x-3' : ''} ${
                    isRight ? 'md:translate-x-3' : ''
                  }`}
                >
                  <div
                    className={`h-full bg-white/70 backdrop-blur-sm p-5 rounded-xl border shadow-md
                      ${
                        isCenter
                          ? 'border-[#FFBE91]/40 shadow-[#FFBE91]/10'
                          : 'border-[#FFDDB0]/30'
                      }
                      hover:shadow-lg transition-all duration-300
                      ${item.borderColor}
                    `}
                  >
                    <Quote
                      className={`absolute top-3 right-3 w-6 h-6 ${
                        isCenter ? 'text-[#FFBE91]/40' : 'text-[#FFDDB0]/30'
                      }`}
                    />

                    <div className="flex gap-0.5 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < item.rating
                              ? 'text-[#FFBE91] fill-[#FFBE91]'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    <p
                      className={`text-[#1A1A2E] leading-relaxed italic pr-5 ${
                        isCenter ? 'text-sm' : 'text-xs'
                      }`}
                    >
                      "{item.content}"
                    </p>

                    <div className="flex items-center gap-2.5 mt-5">
                      <div
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-xs font-bold text-[#1A1A2E] flex-shrink-0`}
                      >
                        {item.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#1A1A2E] text-xs leading-tight">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-[#4A4A5A] leading-tight mt-0.5">
                          {item.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#FFDDB0] flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'w-6 bg-[#FFBE91]'
                      : 'w-2 bg-[#FFDDB0]/50 hover:bg-[#FFDDB0]'
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-[#FFDDB0] flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Progress bar */}
          <div className="max-w-[220px] mx-auto mt-4 h-1 bg-[#FFDDB0]/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FFBE91] to-[#CFEBFF] rounded-full"
              initial={{ width: '0%' }}
              animate={{
                width: `${((currentIndex + 1) / totalSlides) * 100}%`,
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimatedTestimonials;