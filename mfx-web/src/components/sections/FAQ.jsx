import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

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

const FAQItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <motion.div
      className="border-b border-[#FFDDB0] last:border-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="text-[#1A1A2E] font-medium group-hover:text-[#FFBE91] transition-colors">
          {question}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className={`w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'bg-[#FFBE91]/20' : 'bg-[#FFDDB0]/20'} group-hover:bg-[#FFBE91]/30 transition-colors`}
        >
          <ChevronDown className={`w-5 h-5 ${isOpen ? 'text-[#FFBE91]' : 'text-[#4A4A5A]'}`} />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-[#4A4A5A] leading-relaxed">
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

  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />
      
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-4 bg-[#CFEBFF]/20 rounded-full border border-[#CFEBFF]/30">
            <span className="text-sm font-medium text-[#1A1A2E]">❓ FAQ</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="text-[#1A1A2E]">Frequently Asked </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              Questions
            </span>
          </h2>
          
          <p className="mt-4 text-lg text-[#4A4A5A] max-w-2xl mx-auto">
            Everything you need to know about MarketFlip.
          </p>
        </motion.div>

        {/* FAQ List */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-white/60 backdrop-blur-sm rounded-2xl border border-[#FFDDB0]/50 p-6 shadow-sm"
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => toggleFAQ(index)}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;