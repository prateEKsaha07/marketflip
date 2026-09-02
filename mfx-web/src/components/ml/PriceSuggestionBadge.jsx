import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

const PriceSuggestionBadge = ({ 
  suggestedPrice, 
  confidence, 
  minPrice, 
  maxPrice,
  loading = false,
  onAccept = null,
  className = ''
}) => {
  // Confidence level mapping
  const getConfidenceLevel = (score) => {
    if (score >= 0.8) return { label: 'High Confidence', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle size={14} /> };
    if (score >= 0.6) return { label: 'Medium Confidence', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <TrendingUp size={14} /> };
    if (score >= 0.4) return { label: 'Low Confidence', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertCircle size={14} /> };
    return { label: 'Very Low Confidence', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: <AlertCircle size={14} /> };
  };

  const confidenceLevel = getConfidenceLevel(confidence);
  const priceRange = maxPrice - minPrice;
  const positionInRange = priceRange > 0 ? ((suggestedPrice - minPrice) / priceRange) * 100 : 50;
  
  // Determine if price is in the lower, middle, or upper range
  const getRangeLabel = () => {
    if (positionInRange < 33) return 'In lower range - Good deal!';
    if (positionInRange < 66) return 'In middle range - Fair price';
    return 'In upper range - Premium price';
  };

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#EEECE6] animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5F3EF]" />
          <div className="flex-1">
            <div className="h-4 w-24 bg-[#F5F3EF] rounded" />
            <div className="h-3 w-16 bg-[#F5F3EF] rounded mt-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!suggestedPrice) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border ${confidenceLevel.border} shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg ${confidenceLevel.bg} flex items-center justify-center flex-shrink-0`}>
          <Sparkles size={18} className={confidenceLevel.color} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-xs font-medium text-[#A0A0B0]">Suggested Price</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#1A1A2E]">
                  ₹{suggestedPrice.toLocaleString()}
                </span>
                <span className="text-xs text-[#A0A0B0]">
                  (₹{minPrice.toLocaleString()} - ₹{maxPrice.toLocaleString()})
                </span>
              </div>
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${confidenceLevel.bg} ${confidenceLevel.color}`}>
              {confidenceLevel.icon}
              {Math.round(confidence * 100)}%
            </div>
          </div>

          {/* Confidence Level */}
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-[10px] ${confidenceLevel.color}`}>
              {confidenceLevel.label}
            </span>
            <span className="text-[10px] text-[#A0A0B0]">·</span>
            <span className="text-[10px] text-[#A0A0B0]">
              {getRangeLabel()}
            </span>
          </div>

          {/* Price Range Bar */}
          <div className="mt-2">
            <div className="relative h-1.5 bg-[#F5F3EF] rounded-full overflow-hidden">
              <div
                className="absolute h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 rounded-full"
                style={{ width: '100%' }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-[#1A1A2E] rounded-full border-2 border-white shadow-md"
                style={{ left: `${positionInRange}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <div className="flex justify-between text-[8px] text-[#A0A0B0] mt-0.5">
              <span>₹{minPrice.toLocaleString()}</span>
              <span className="text-[#FFBE91]">▼ Suggested</span>
              <span>₹{maxPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Accept Button */}
          {onAccept && (
            <button
              onClick={onAccept}
              className="mt-3 text-xs font-medium text-[#FFBE91] hover:text-[#FFA87A] transition-colors flex items-center gap-1"
            >
              Use this price →
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PriceSuggestionBadge;