import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-[#FFDDB0] pt-12 pb-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-2xl font-bold">
              <span className="text-[#1A1A2E]">Market</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] to-[#CFEBFF]">Flip</span>
            </Link>
            <p className="mt-2 text-sm text-[#4A4A5A]">Flip How You Buy.</p>
            <p className="mt-4 text-sm text-[#4A4A5A] max-w-xs">
              Connecting buyers and sellers in local communities.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-[#1A1A2E] text-sm mb-4">Product</h4>
            <ul className="space-y-3">
              {['Features', 'How It Works', 'Pricing', 'FAQ'].map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <a href={`#${item.toLowerCase().replace(/\s/g, '-')}`} className="text-sm text-[#4A4A5A] hover:text-[#FFBE91] transition-colors flex items-center gap-1 group">
                    {item}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-[#1A1A2E] text-sm mb-4">Company</h4>
            <ul className="space-y-3">
              {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <a href="#" className="text-sm text-[#4A4A5A] hover:text-[#FFBE91] transition-colors flex items-center gap-1 group">
                    {item}
                    <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold text-[#1A1A2E] text-sm mb-4">Connect</h4>
            
            {/* Social Icons */}
            <div className="flex gap-3 mb-4">
              {[
                { icon: '📘', href: '#', label: 'Facebook' },
                { icon: '🐦', href: '#', label: 'Twitter' },
                { icon: '📸', href: '#', label: 'Instagram' },
                { icon: '💼', href: '#', label: 'LinkedIn' },
                { icon: '🐙', href: '#', label: 'GitHub' },
              ].map((social, index) => (
                <motion.a
                  key={index}
                  href={social.href}
                  whileHover={{ y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-10 h-10 rounded-full bg-[#FFDDB0]/20 border border-[#FFDDB0]/50 flex items-center justify-center text-[#1A1A2E] hover:bg-[#FFBE91]/20 hover:border-[#FFBE91] transition-all text-lg"
                  aria-label={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>

            {/* Legal Links */}
            <ul className="space-y-2">
              {['Privacy Policy', 'Terms of Service'].map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 4 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  <a href="#" className="text-xs text-[#4A4A5A] hover:text-[#FFBE91] transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-[#FFDDB0] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[#4A4A5A]">
            © {new Date().getFullYear()} MarketFlip. All rights reserved.
          </p>
          
          {/* Back to Top Button */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -3, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="flex items-center gap-2 px-4 py-2 text-sm text-[#1A1A2E] bg-[#FFDDB0]/30 hover:bg-[#FFBE91]/30 rounded-full border border-[#FFDDB0]/50 hover:border-[#FFBE91] transition-all"
          >
            <span>Back to Top</span>
            <ArrowUpRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;