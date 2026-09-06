import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Button } from '@/components/ui/button';
import { LogIn, User, Menu, X } from 'lucide-react';

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    const controlNavbar = () => {
      const currentScrollY = window.scrollY;
      
      // Hide navbar when scrolling down, show when scrolling up
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', controlNavbar);

    return () => {
      window.removeEventListener('scroll', controlNavbar);
    };
  }, [lastScrollY]);

  const handleSmoothScroll = (e, targetId) => {
    e.preventDefault();
    setIsOpen(false);
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      const offsetTop = targetElement.getBoundingClientRect().top + window.pageYOffset - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  };

  const scrollToTop = (e) => {
    e.preventDefault();
    setIsOpen(false);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ 
          y: isVisible ? 0 : -100, 
          opacity: isVisible ? 1 : 0 
        }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.46, 0.45, 0.94] 
        }}
        className="fixed top-0 left-0 right-0 z-50 bg-transparent"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a 
            href="/" 
            onClick={scrollToTop}
            className="text-2xl font-bold cursor-pointer"
          >
            <span className="text-[#1A1A2E]">Market</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBE91] to-[#CFEBFF]">Flip</span>
          </a>

          <div className="hidden md:flex items-center gap-6">
            <a 
              href="/" 
              onClick={scrollToTop}
              className="text-sm text-[#1A1A2E] hover:text-[#FFBE91] transition-colors cursor-pointer"
            >
              Home
            </a>
            <a 
              href="#features" 
              onClick={(e) => handleSmoothScroll(e, '#features')}
              className="text-sm text-[#1A1A2E] hover:text-[#FFBE91] transition-colors cursor-pointer"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => handleSmoothScroll(e, '#how-it-works')}
              className="text-sm text-[#1A1A2E] hover:text-[#FFBE91] transition-colors cursor-pointer"
            >
              How It Works
            </a>
            <a 
              href="#testimonials" 
              onClick={(e) => handleSmoothScroll(e, '#testimonials')}
              className="text-sm text-[#1A1A2E] hover:text-[#FFBE91] transition-colors cursor-pointer"
            >
              Testimonials
            </a>
            {isAuthenticated ? (
              <>
                <Link to={user?.role === 'buyer' ? '/buyer/dashboard' : '/shop/dashboard'}>
                  <Button variant="ghost" className="text-[#1A1A2E] hover:text-[#FFBE91] hover:bg-transparent">
                    <User size={16} className="mr-1.5" />
                    Dashboard
                  </Button>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="text-sm text-[#1A1A2E] hover:text-[#FFBE91] transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/auth')}
                className="flex items-center gap-1.5 text-sm text-[#1A1A2E] hover:text-[#FFBE91] transition-colors"
              >
                <LogIn size={16} />
                Login
              </button>
            )}
          </div>

          <button
            className="md:hidden text-[#1A1A2E] z-[60] relative"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu - Now inside the nav and will hide/show with it */}
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                duration: 0.3,
                ease: "easeInOut"
              }}
              className="md:hidden bg-white/95 backdrop-blur-md shadow-lg absolute top-full left-0 right-0 z-50"
            >
              <div className="px-4 py-6 flex flex-col gap-4">
                <a 
                  href="/" 
                  onClick={scrollToTop} 
                  className="text-[#1A1A2E] hover:text-[#FFBE91] transition-colors py-2"
                >
                  Home
                </a>
                <a 
                  href="#features" 
                  onClick={(e) => handleSmoothScroll(e, '#features')} 
                  className="text-[#1A1A2E] hover:text-[#FFBE91] transition-colors py-2"
                >
                  Features
                </a>
                <a 
                  href="#how-it-works" 
                  onClick={(e) => handleSmoothScroll(e, '#how-it-works')} 
                  className="text-[#1A1A2E] hover:text-[#FFBE91] transition-colors py-2"
                >
                  How It Works
                </a>
                <a 
                  href="#testimonials" 
                  onClick={(e) => handleSmoothScroll(e, '#testimonials')} 
                  className="text-[#1A1A2E] hover:text-[#FFBE91] transition-colors py-2"
                >
                  Testimonials
                </a>
                <hr className="border-gray-200" />
                {isAuthenticated ? (
                  <>
                    <Link 
                      to={user?.role === 'buyer' ? '/buyer/dashboard' : '/shop/dashboard'}
                      onClick={() => setIsOpen(false)}
                    >
                      <Button variant="ghost" className="w-full justify-start text-[#1A1A2E] hover:text-[#FFBE91] hover:bg-transparent px-0 py-2">
                        <User size={16} className="mr-2" />
                        Dashboard
                      </Button>
                    </Link>
                    <button 
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }} 
                      className="text-[#1A1A2E] hover:text-[#FFBE91] text-left py-2"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      navigate('/auth');
                    }} 
                    className="flex items-center gap-2 text-[#1A1A2E] hover:text-[#FFBE91] transition-colors py-2"
                  >
                    <LogIn size={16} />
                    Login
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
      
      {/* Backdrop overlay for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default LandingNavbar;