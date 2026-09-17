import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { User, Menu, X } from 'lucide-react';

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setScrolled(currentScrollY > 20);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar, { passive: true });
    return () => window.removeEventListener('scroll', controlNavbar);
  }, [lastScrollY]);

  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    setIsOpen(false);
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const offsetTop =
        targetElement.getBoundingClientRect().top + window.pageYOffset - 48;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    setIsOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Home', href: '/', onClick: scrollToTop },
    { label: 'Features', href: '#features', onClick: (e) => handleSmoothScroll(e, '#features') },
    { label: 'How It Works', href: '#how-it-works', onClick: (e) => handleSmoothScroll(e, '#how-it-works') },
    { label: 'Testimonials', href: '#testimonials', onClick: (e) => handleSmoothScroll(e, '#testimonials') },
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: isVisible ? 0 : -100,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div
          className={`transition-all duration-300 ${
            scrolled
              ? 'bg-[#FFFCE1]/80 backdrop-blur-xl border-b border-[#1A1A2E]/5'
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          <div className="max-w-6xl mx-auto px-3 sm:px-5
                          h-10 sm:h-11
                          flex items-center justify-between gap-3">
            {/* LEFT: Logo */}
            <a
              href="/"
              onClick={scrollToTop}
              className="text-[15px] sm:text-base font-bold cursor-pointer
                         tracking-tight leading-none flex-shrink-0"
            >
              <span className="text-[#1A1A2E]">Market</span>
              <span className="text-transparent bg-clip-text
                               bg-gradient-to-r
                               from-[#FFBE91] via-[#FFDDB0] to-[#CFEBFF]">
                Flip
              </span>
            </a>

            {/* RIGHT: Nav + Auth */}
            <div className="flex items-center gap-0 min-w-0">
              {/* Desktop nav links */}
              <div className="hidden md:flex items-center gap-0">
                {navLinks.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={link.onClick}
                    className="px-2 py-1 text-[11.5px] font-medium
                               text-[#4A4A5A]
                               hover:text-[#1A1A2E]
                               transition-colors rounded-full
                               hover:bg-[#1A1A2E]/5 whitespace-nowrap
                               leading-none"
                  >
                    {link.label}
                  </a>
                ))}
              </div>

              {/* Divider */}
              {isAuthenticated && (
                <div className="hidden md:block w-px h-3.5 bg-[#1A1A2E]/10 mx-1" />
              )}

              {/* Desktop auth */}
              <div className="hidden md:flex items-center gap-0">
                {isAuthenticated && (
                  <>
                    <Link
                      to={user?.role === 'buyer' ? '/buyer/dashboard' : '/shop/dashboard'}
                    >
                      <button
                        className="inline-flex items-center gap-1
                                   px-2 py-1 text-[11.5px] font-medium
                                   text-[#1A1A2E]
                                   hover:bg-[#1A1A2E]/5
                                   rounded-full transition-colors
                                   whitespace-nowrap leading-none"
                      >
                        <User size={12} strokeWidth={2.2} />
                        Dashboard
                      </button>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-2 py-1 text-[11.5px] font-medium
                                 text-[#A0A0B0] hover:text-[#1A1A2E]
                                 transition-colors rounded-full
                                 hover:bg-[#1A1A2E]/5 whitespace-nowrap
                                 leading-none"
                    >
                      Logout
                    </button>
                  </>
                )}
              </div>

              {/* Mobile toggle */}
              <button
                className="md:hidden relative z-[60]
                           w-7 h-7 grid place-items-center
                           text-[#1A1A2E]
                           rounded-full
                           hover:bg-[#1A1A2E]/5
                           transition-colors flex-shrink-0"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
                aria-expanded={isOpen}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isOpen ? (
                    <motion.span
                      key="close"
                      initial={{ opacity: 0, rotate: -45 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 45 }}
                      transition={{ duration: 0.18 }}
                    >
                      <X size={16} strokeWidth={2.2} />
                    </motion.span>
                  ) : (
                    <motion.span
                      key="menu"
                      initial={{ opacity: 0, rotate: -45 }}
                      animate={{ opacity: 1, rotate: 0 }}
                      exit={{ opacity: 0, rotate: 45 }}
                      transition={{ duration: 0.18 }}
                    >
                      <Menu size={16} strokeWidth={2.2} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-40 md:hidden
                         bg-[#1A1A2E]/20 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              key="menu"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-[44px] sm:top-[48px] left-2.5 right-2.5 z-50 md:hidden
                         bg-white rounded-xl
                         ring-1 ring-[#1A1A2E]/5
                         shadow-[0_12px_40px_-12px_rgba(26,26,46,0.25)]
                         overflow-hidden"
            >
              <div className="p-1.5">
                {navLinks.map((link, i) => (
                  <motion.a
                    key={link.label}
                    href={link.href}
                    onClick={link.onClick}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.04, duration: 0.25 }}
                    className="block px-3 py-2 text-[12.5px] font-medium
                               text-[#1A1A2E]
                               hover:bg-[#F8F6F0]
                               rounded-lg transition-colors"
                  >
                    {link.label}
                  </motion.a>
                ))}

                {isAuthenticated && (
                  <>
                    <div className="h-px bg-[#EEECE6] my-1 mx-2" />
                    <div className="p-0.5 space-y-0.5">
                      <Link
                        to={user?.role === 'buyer' ? '/buyer/dashboard' : '/shop/dashboard'}
                        onClick={() => setIsOpen(false)}
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.25, duration: 0.25 }}
                          className="flex items-center gap-2 px-3 py-2
                                     text-[12.5px] font-medium text-[#1A1A2E]
                                     hover:bg-[#F8F6F0]
                                     rounded-lg transition-colors"
                        >
                          <User size={13} strokeWidth={2.2} />
                          Dashboard
                        </motion.div>
                      </Link>
                      <motion.button
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.29, duration: 0.25 }}
                        onClick={() => {
                          setIsOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-3 py-2
                                   text-[12.5px] font-medium text-[#A0A0B0]
                                   hover:text-[#1A1A2E]
                                   hover:bg-[#F8F6F0]
                                   rounded-lg transition-colors"
                      >
                        Logout
                      </motion.button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavbar;