import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Sparkles } from 'lucide-react';

const faqs = [
  {
    question: 'Is MarketFlip free to use?',
    answer: 'Yes! Posting requests and viewing bids is completely free for buyers. Shop owners also register for free. We believe in making local commerce accessible to everyone.'
  },
  {
    question: 'How do I know a shop is trustworthy?',
    answer: 'We show shop ratings and reviews from verified buyers. Additionally, contact details are only shared after you select a bid, ensuring your privacy is protected throughout the process.'
  },
  {
    question: 'What happens after I select a bid?',
    answer: 'Once you select a bid, the shop\'s contact details are revealed. You can then call or message them directly to arrange delivery, pickup, and complete the transaction offline.'
  },
  {
    question: 'Can I edit my request after posting?',
    answer: 'Yes! As long as your request is still in "open" status, you can edit the item name, description, budget, pincode, and other details from your dashboard.'
  },
  {
    question: 'How long does a request stay active?',
    answer: 'Requests automatically expire after 7 days if no bid is selected. You can also manually delete or close your request at any time from your dashboard.'
  },
  {
    question: 'What payment methods are supported?',
    answer: 'MarketFlip is a discovery platform — we connect buyers and sellers. The actual payment happens offline directly between you and the shop owner. This gives you flexibility in choosing your preferred payment method.'
  },
];

const FAQItem = ({ question, answer, isOpen, onClick, index }) => {
  return (
    <motion.div
      className="border-b border-[#EEECE6] last:border-0"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <button
        onClick={onClick}
        className="w-full py-3.5 flex items-center justify-between text-left group"
      >
        <span className="text-sm font-medium text-[#1A1A2E] group-hover:text-[#FFBE91] transition-colors pr-4">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            isOpen 
              ? 'bg-[#FFBE91]/20 text-[#FFBE91]' 
              : 'bg-[#F8F6F0] text-[#A0A0B0] group-hover:bg-[#F5F3EF]'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>
      
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-[#4A4A5A] leading-relaxed max-w-3xl">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        duration: 0.4,
        ease: "easeOut",
        staggerChildren: 0.06,
      }
    }
  };

  return (
    <section className="relative py-16 md:py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          viewport={{ once: true, margin: "-60px" }}
          className="text-center mb-10"
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 bg-[#CFEBFF]/20 rounded-full border border-[#CFEBFF]/30"
          >
            <HelpCircle size={12} className="text-[#1A1A2E]" />
            <span className="text-[10px] font-medium text-[#1A1A2E] tracking-wide uppercase">FAQ</span>
          </motion.div>
          
          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Frequently Asked </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              Questions
            </span>
          </h2>
          
          <p className="mt-2 text-sm text-[#4A4A5A] max-w-2xl mx-auto">
            Everything you need to know about MarketFlip.
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-30px" }}
          className="bg-white/70 backdrop-blur-sm rounded-xl border border-[#EEECE6] p-4 md:p-6 shadow-sm"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              index={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-xs text-[#4A4A5A]">
            Still have questions? <span className="text-[#FFBE91] font-medium">Contact us</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;