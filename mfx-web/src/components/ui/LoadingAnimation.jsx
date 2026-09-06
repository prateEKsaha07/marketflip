// src/components/ui/LoadingAnimation.jsx
import React, { useEffect, useRef, useState } from 'react';
import lottie from 'lottie-web';

// Import your 3 animations
import catAnimation from '../../../public/animations/Cat-playing.json';
import catCrying from '../../../public/animations/Cat-Crying.json';
// import animation3 from '../../../public/animations/Animation3.json';

const LoadingAnimation = () => {
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [selectedAnimation, setSelectedAnimation] = useState(null);

  // List of all animations
  const animations = [
    { name: 'Cat', data: catAnimation },
    { name: 'Cat Crying', data: catCrying },
    // { name: 'Animation 3', data: animation3 },
  ];

  useEffect(() => {
    // Select a random animation when component mounts
    const randomIndex = Math.floor(Math.random() * animations.length);
    setSelectedAnimation(animations[randomIndex]);
  }, []);

  useEffect(() => {
    if (!containerRef.current || !selectedAnimation) return;

    if (animationRef.current) {
      animationRef.current.destroy();
      animationRef.current = null;
    }

    try {
      animationRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        animationData: selectedAnimation.data,
      });
    } catch (error) {
      console.error('Failed to load animation:', error);
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.destroy();
        animationRef.current = null;
      }
    };
  }, [selectedAnimation]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <div 
        ref={containerRef} 
        className="w-80 h-80"
        style={{ minHeight: '320px', minWidth: '320px' }}
      />
    </div>
  );
};

export default LoadingAnimation;