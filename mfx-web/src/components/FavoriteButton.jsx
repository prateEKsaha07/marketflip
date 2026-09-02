import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../api/client';

const FavoriteButton = ({ targetType, targetId, size = 20, className = '' }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    checkFavorite();
  }, [targetType, targetId]);

  const checkFavorite = async () => {
    try {
      const response = await api.get(`/favorites/check/${targetType}/${targetId}`);
      setIsFavorited(response.data.favorited);
    } catch (err) {
      console.error('Failed to check favorite:', err);
    }
  };

  const toggleFavorite = async (e) => {
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const response = await api.post('/favorites/toggle', {
        target_type: targetType,
        target_id: targetId
      });
      
      setIsFavorited(response.data.favorited);
      
      // Trigger animation
      setAnimate(true);
      setTimeout(() => setAnimate(false), 600);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.button
      onClick={toggleFavorite}
      disabled={loading}
      className={`p-1.5 rounded-lg hover:bg-[#F5F3EF] transition-colors ${className}`}
      whileTap={{ scale: 0.85 }}
      animate={animate ? { scale: [1, 1.4, 1] } : {}}
      transition={{ duration: 0.3 }}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        size={size}
        className={`transition-all ${
          isFavorited 
            ? 'fill-rose-500 text-rose-500' 
            : 'text-[#A0A0B0] hover:text-rose-500'
        }`}
      />
    </motion.button>
  );
};

export default FavoriteButton;