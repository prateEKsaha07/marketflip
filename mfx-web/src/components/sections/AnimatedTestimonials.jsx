import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote, Star, Sparkles } from 'lucide-react';

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
  const [direction, setDirection] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const intervalRef = useRef(null);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const totalSlides = testimonials.length;
  const visibleCount = 3;

  // Auto-slide - FIXED
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Start new interval
    intervalRef.current = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 4000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [totalSlides]); // Re-run if totalSlides changes

  // Pause on hover - FIXED
  useEffect(() => {
    if (isHovering) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Restart interval when not hovering
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalRef.current = setInterval(() => {
        setDirection(1);
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
      }, 4000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isHovering, totalSlides]);

  const goToSlide = (index) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      nextSlide();
    }
    if (distance < -50) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  // Get visible testimonials (centered)
  const getVisibleTestimonials = () => {
    const result = [];
    for (let i = 0; i < visibleCount; i++) {
      const index = (currentIndex + i) % totalSlides;
      result.push({
        ...testimonials[index],
        position: i === 1 ? 'center' : i === 0 ? 'left' : 'right',
        index: index,
      });
    }
    return result;
  };

  const visibleTestimonials = getVisibleTestimonials();

  return (
    <section id='testimonials' className="relative py-20 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
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

        {/* Carousel Container */}
        <div 
          className="relative max-w-5xl mx-auto"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Glow Effects */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#FFBE91]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-[#CFEBFF]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Slides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 relative min-h-[380px]">
            {visibleTestimonials.map((item, idx) => {
              const isCenter = idx === 1;
              const isLeft = idx === 0;
              const isRight = idx === 2;

              return (
                <motion.div
                  key={`${item.id}-${currentIndex}`}
                  initial={{ 
                    opacity: 0, 
                    scale: isCenter ? 0.9 : 0.7,
                    y: 20,
                  }}
                  animate={{ 
                    opacity: 1, 
                    scale: isCenter ? 1 : 0.85,
                    y: isCenter ? 0 : 20,
                  }}
                  exit={{ 
                    opacity: 0, 
                    scale: isCenter ? 0.9 : 0.7,
                    y: -20,
                  }}
                  transition={{ 
                    duration: 0.5, 
                    ease: "easeInOut",
                    type: "spring",
                    stiffness: 300,
                    damping: 25,
                  }}
                  whileHover={isCenter ? { y: -8, scale: 1.02 } : {}}
                  className={`relative group cursor-pointer ${
                    isCenter ? 'z-20' : 'z-10'
                  } ${isCenter ? 'md:scale-100' : 'md:scale-90'} ${
                    isLeft ? 'md:-translate-x-4' : ''
                  } ${isRight ? 'md:translate-x-4' : ''}`}
                >
                  <div className={`
                    h-full bg-white/70 backdrop-blur-sm p-6 md:p-8 rounded-2xl border shadow-lg
                    ${isCenter ? 'border-[#FFBE91]/40 shadow-[#FFBE91]/10' : 'border-[#FFDDB0]/30 shadow-sm'}
                    hover:shadow-xl transition-all duration-300
                    ${item.borderColor}
                  `}>
                    {/* Quote Icon */}
                    <Quote className={`absolute top-4 right-4 w-8 h-8 ${
                      isCenter ? 'text-[#FFBE91]/40' : 'text-[#FFDDB0]/30'
                    }`} />
                    
                    {/* Rating */}
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < item.rating ? 'text-[#FFBE91] fill-[#FFBE91]' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Content */}
                    <p className={`text-[#1A1A2E] leading-relaxed italic ${
                      isCenter ? 'text-base' : 'text-sm'
                    }`}>
                      "{item.content}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center gap-3 mt-6">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-sm font-bold text-[#1A1A2E] flex-shrink-0`}>
                        {item.avatar}
                      </div>
                      <div>
                        <p className="font-semibold text-[#1A1A2E] text-sm">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#4A4A5A]">{item.role}</p>
                      </div>
                    </div>

                    {/* Center Card Glow Effect */}
                    {isCenter && (
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFBE91]/20 via-[#FFDDB0]/20 to-[#CFEBFF]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                    )}

                    {/* Sparkle animation for center card */}
                    {isCenter && (
                      <motion.div
                        className="absolute top-2 right-2"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4 text-[#FFBE91]/30" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-center items-center gap-4 mt-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={prevSlide}
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-[#FFDDB0] flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm"
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>

            {/* Dot Indicators */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'w-8 bg-[#FFBE91]' 
                      : 'w-2 bg-[#FFDDB0]/50 hover:bg-[#FFDDB0]'
                  }`}
                />
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={nextSlide}
              className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-sm border border-[#FFDDB0] flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all shadow-sm"
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Progress Bar */}
          <div className="max-w-xs mx-auto mt-4 h-1 bg-[#FFDDB0]/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#FFBE91] to-[#CFEBFF] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {/* Slide Counter */}
          <p className="text-center text-sm text-[#4A4A5A] mt-3">
            {currentIndex + 1} / {totalSlides}
          </p>
        </div>
      </div>
    </section>
  );
};

export default AnimatedTestimonials;