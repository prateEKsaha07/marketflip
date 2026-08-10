import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Heart, MapPin, Mail } from 'lucide-react';

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    product: ['Features', 'How It Works', 'Pricing', 'FAQ'],
    company: ['About', 'Blog', 'Careers', 'Contact'],
    legal: ['Privacy Policy', 'Terms of Service'],
  };

  const socialLinks = [
    { label: 'Facebook', href: '#' },
    { label: 'Twitter', href: '#' },
    { label: 'Instagram', href: '#' },
    { label: 'LinkedIn', href: '#' },
    { label: 'GitHub', href: '#' },
  ];

  return (
    <footer className="bg-white/80 backdrop-blur-md border-t border-[#EEECE6] pt-12 pb-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="text-xl font-bold">
              <span className="text-[#1A1A2E]">Market</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] to-[#CFEBFF]">Flip</span>
            </Link>
            <p className="mt-1.5 text-xs text-[#4A4A5A]">Flip How You Buy.</p>
            <p className="mt-3 text-xs text-[#A0A0B0] max-w-xs leading-relaxed">
              Connecting buyers and sellers in local communities.
            </p>
            <div className="mt-3 flex items-center gap-1.5 text-[10px] text-[#A0A0B0]">
              <MapPin size={12} />
              <span>Bhilai, India</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-[#1A1A2E] text-xs mb-3 uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              {footerLinks.product.map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <a 
                    href={`#${item.toLowerCase().replace(/\s/g, '-')}`} 
                    className="text-xs text-[#4A4A5A] hover:text-[#FFBE91] transition-colors flex items-center gap-1 group"
                  >
                    {item}
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold text-[#1A1A2E] text-xs mb-3 uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <a href="#" className="text-xs text-[#4A4A5A] hover:text-[#FFBE91] transition-colors flex items-center gap-1 group">
                    {item}
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-[#1A1A2E] text-xs mb-3 uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2">
              {footerLinks.legal.map((item) => (
                <motion.li
                  key={item}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <a href="#" className="text-xs text-[#4A4A5A] hover:text-[#FFBE91] transition-colors">
                    {item}
                  </a>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-semibold text-[#1A1A2E] text-xs mb-3 uppercase tracking-wider">Connect</h4>
            
            {/* Social Links - Text based */}
            <ul className="space-y-2">
              {socialLinks.map((social) => (
                <motion.li
                  key={social.label}
                  whileHover={{ x: 3 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  <a 
                    href={social.href} 
                    className="text-xs text-[#4A4A5A] hover:text-[#FFBE91] transition-colors flex items-center gap-1 group"
                  >
                    {social.label}
                    <ArrowUpRight className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </motion.li>
              ))}
            </ul>

            <div className="mt-3 pt-3 border-t border-[#EEECE6] flex items-center gap-1.5 text-[10px] text-[#A0A0B0]">
              <Mail size={12} />
              <span>support@marketflip.com</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-5 border-t border-[#EEECE6] flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-[10px] text-[#A0A0B0]">
            © {new Date().getFullYear()} MarketFlip. All rights reserved.
          </p>
          
          <div className="flex items-center gap-4 text-[10px] text-[#A0A0B0]">
            <span>Made with</span>
            <Heart size={11} className="text-[#FFBE91] fill-[#FFBE91]" />
            <span>in Bhilai</span>
          </div>
          
          {/* Back to Top Button */}
          <motion.button
            onClick={scrollToTop}
            whileHover={{ y: -2, scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] text-[#1A1A2E] bg-[#F8F6F0] hover:bg-[#FFBE91]/10 rounded-full border border-[#EEECE6] hover:border-[#FFBE91] transition-all"
          >
            <span>Back to Top</span>
            <ArrowUpRight className="w-3 h-3" />
          </motion.button>
        </div>
      </div>
    </footer>
  );
};

export default Footer;