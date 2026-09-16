import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: 'Is MarketFlip free to use?',
    answer:
      'Yes! Posting requests, starting auctions, and viewing bids is completely free for buyers. Shop owners also register for free. We believe in making local commerce accessible to everyone.',
  },
  {
    question: 'How do I know a shop is trustworthy?',
    answer:
      'Every shop carries a reliability score based on real completed deals. Contact details are only shared after you select a bid, so your privacy is protected end to end.',
  },
  {
    question: 'What happens after I select a bid?',
    answer:
      'The shop\'s contact details are revealed immediately. You can call or message them directly to arrange delivery or pickup, and a verification code confirms the handoff once it\'s done.',
  },
  {
    question: 'Can I edit my request after posting?',
    answer:
      'Yes — as long as your request is still open, you can edit the item name, description, budget, pincode, and other details from your dashboard.',
  },
  {
    question: 'How long does a request stay active?',
    answer:
      'Requests automatically expire after 7 days if no bid is selected. You can also delete or close your request at any time from your dashboard.',
  },
  {
    question: 'What payment methods are supported?',
    answer:
      'MarketFlip is a discovery platform — we connect buyers and sellers. The actual payment happens offline directly between you and the shop, giving you full flexibility on payment method.',
  },
  {
    question: 'What\'s the difference between a request and an auction?',
    answer:
      'A request is you telling shops what you want — they come to you with bids. An auction is a shop listing an item with a starting price — buyers bid up until the timer runs out. Both end with you picking the best deal.',
  },
  {
    question: 'How does the AI assistant work?',
    answer:
      'Just describe what you want in plain English — like "need a used bike under 8000 in 560001". The assistant turns it into a structured request you can review and edit before posting. You can also ask it questions about your own requests and bids.',
  },
  {
    question: 'Are the shop details and buyer details kept private?',
    answer:
      'Yes. Shop contact details are only revealed to the buyer whose bid is selected. Buyer identity is only revealed to the shop once a bid is chosen. Neither side sees the other\'s contact information until the match is confirmed.',
  },
  {
    question: 'What happens if a shop never delivers?',
    answer:
      'Every transaction requires a verification code to be marked complete. If a shop fails to deliver, the transaction never closes, and their reliability score is affected. You can also report the shop from the request page.',
  },
  {
    question: 'Can I use MarketFlip outside my city?',
    answer:
      'MarketFlip is built around local commerce. Requests are matched to shops in the same pincode you specify, so you get offers from sellers who can actually deliver or arrange pickup nearby.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'You can delete your account from the profile settings page. All your requests, bids, and chats are removed. Any completed transactions are kept for record-keeping as required by law.',
  },
];

const FAQItem = ({ question, answer, isOpen, onClick, index }) => {
  return (
    <motion.div
      className="border-b border-[#EEECE6] last:border-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
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
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isOpen
              ? 'bg-[#FFBE91]/20 text-[#FFBE91]'
              : 'bg-[#F8F6F0] text-[#A0A0B0] group-hover:bg-[#F5F3EF]'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              duration: 0.35,
              ease: [0.16, 1, 0.3, 1],
              opacity: { duration: 0.25 },
            }}
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
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        staggerChildren: 0.03,
      },
    },
  };

  return (
    <section className="relative py-16 px-4 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#FFFCE1] via-white/80 to-[#FFFCE1]" />

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true, margin: '-60px' }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-[#CFEBFF]/20 rounded-full border border-[#CFEBFF]/30"
          >
            <HelpCircle size={11} className="text-[#1A1A2E]" />
            <span className="text-[10px] font-medium text-[#1A1A2E] tracking-wide uppercase">
              FAQ
            </span>
          </motion.div>

          <h2 className="text-3xl md:text-4xl font-bold leading-tight">
            <span className="text-[#1A1A2E]">Frequently asked </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
              questions
            </span>
          </h2>

          <p className="mt-3 text-sm text-[#4A4A5A] max-w-xl mx-auto">
            Everything you need to know about MarketFlip.
          </p>
        </motion.div>

        {/* FAQ list */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-30px' }}
          className="bg-white/70 backdrop-blur-sm rounded-xl border border-[#EEECE6] px-4 md:px-6 py-2 shadow-sm"
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
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
          className="text-center mt-8"
        >
          <p className="text-xs text-[#4A4A5A]">
            Still have questions?{' '}
            <a
              href="mailto:prateeksaha963@gmail.com"
              className="text-[#FFBE91] font-medium hover:text-[#FFA87A] transition-colors"
            >
              Contact us
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default FAQ;