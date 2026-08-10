import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  // Warm, aesthetic colors from your palette
  const colors = [
    'rgba(255, 190, 145, 0.15)',  // Peach
    'rgba(255, 221, 176, 0.12)',  // Cream
    'rgba(207, 235, 255, 0.10)',  // Soft Blue
    'rgba(255, 252, 225, 0.08)',  // Light Cream
  ];

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden bg-[#FFFCE1]">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFBE91]/5 via-[#FFFCE1]/30 to-[#CFEBFF]/10" />
      
      {/* Floating shapes */}
      <motion.div
        className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#FFBE91]/20 blur-3xl"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#CFEBFF]/20 blur-3xl"
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />

      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#FFDDB0]/15 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        className="absolute top-40 right-40 w-48 h-48 rounded-full bg-[#FFBE91]/10 blur-2xl"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
      />

      <motion.div
        className="absolute bottom-40 left-20 w-56 h-56 rounded-full bg-[#CFEBFF]/10 blur-2xl"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -20, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

      {/* Floating orbs */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            background: [colors[i % colors.length]],
            left: `${10 + Math.random() * 80}%`,
            top: `${10 + Math.random() * 80}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8,
          }}
        />
      ))}
    </div>
  );
};

export default AnimatedBackground;