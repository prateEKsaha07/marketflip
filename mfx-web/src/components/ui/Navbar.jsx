import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

const navItems = [
  { name: "Dashboard", path: "/buyer/dashboard" },
  { name: "Requests", path: "/buyer/requests" },
  { name: "Auctions", path: "/buyer/auctions" },
  { name: "Chats", path: "/buyer/chat" },
  { name: "History", path: "/buyer/history" },
];

export default function ModernNavbar() {
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [location]);

  const currentIndex = navItems.findIndex((item) => item.path === location.pathname);

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-xl shadow-black/5"
            : "bg-white dark:bg-gray-900 border-b border-gray-200/50 dark:border-gray-700/50"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-[72px]">
            {/* Logo */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="flex items-center gap-2.5 shrink-0"
            >
              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                <span className="text-white font-bold text-sm">MF</span>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hidden sm:block">
                MarketFlip
              </span>
            </motion.div>

            {/* Desktop Navigation - Pill Style */}
            <div className="hidden md:flex items-center bg-gray-100/50 dark:bg-gray-800/50 p-1 rounded-xl relative flex-1 max-w-2xl mx-4">
              {/* Rolling Pill Indicator */}
              <AnimatePresence>
                {currentIndex >= 0 && (
                  <motion.div
                    layoutId="rolling-pill"
                    className="absolute h-[calc(100%-8px)] bg-white dark:bg-gray-700 rounded-lg shadow-md shadow-black/5"
                    style={{
                      left: 4,
                      width: `calc(${100 / navItems.length}% - 8px)`,
                      top: 4,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                    animate={{
                      x: currentIndex * (100 / navItems.length) * 0.98,
                    }}
                  />
                )}
              </AnimatePresence>

              {navItems.map((item, index) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="relative z-10 flex-1"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`px-2 py-2 rounded-lg text-sm font-medium transition-colors duration-200 text-center ${
                        isActive
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                      }`}
                    >
                      {item.name}
                    </motion.div>
                  </Link>
                );
              })}
            </div>

            {/* Right Side - CTA */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:block px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-shadow whitespace-nowrap"
              >
                Profile
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden sm:block px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors whitespace-nowrap"
              >
                Logout
              </motion.button>

              {/* Mobile Toggle */}
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsMobileOpen(false)}
            />
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-2xl z-50 md:hidden"
            >
              <div className="flex flex-col h-full pt-20 px-6">
                <div className="flex-1 space-y-1">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link key={item.path} to={item.path}>
                        <motion.div
                          whileHover={{ x: 8 }}
                          whileTap={{ scale: 0.98 }}
                          className={`px-4 py-3 rounded-xl font-medium transition-all ${
                            isActive
                              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/25"
                              : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {item.name}
                        </motion.div>
                      </Link>
                    );
                  })}
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-8 space-y-2">
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/25"
                  >
                    Profile
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium rounded-xl"
                  >
                    Logout
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer */}
      <div className="h-16 lg:h-[72px]" />
    </>
  );
}