import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Shield, 
  AlertTriangle, 
  XCircle,
  TrendingUp,
  Clock,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle
} from 'lucide-react';

const ReliabilityBadge = ({ 
  score = 0,
  shopName = '',
  showDetails = false,
  compact = false,
  size = 'md',
  className = '',
  onHover = null,
  metrics = null
}) => {
  const [expanded, setExpanded] = useState(false);

  // Get badge configuration based on score
  const getBadgeConfig = (score) => {
    if (score >= 80) {
      return {
        label: 'Highly Reliable',
        color: 'text-emerald-700',
        bg: 'bg-emerald-100',
        border: 'border-emerald-200',
        icon: <ShieldCheck size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />,
        dot: 'bg-emerald-500',
        shadow: 'shadow-emerald-100',
        description: 'Excellent track record, highly trustworthy'
      };
    }
    if (score >= 60) {
      return {
        label: 'Reliable',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
        border: 'border-blue-200',
        icon: <Shield size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />,
        dot: 'bg-blue-500',
        shadow: 'shadow-blue-100',
        description: 'Good track record, trustworthy'
      };
    }
    if (score >= 40) {
      return {
        label: 'Moderately Reliable',
        color: 'text-amber-700',
        bg: 'bg-amber-100',
        border: 'border-amber-200',
        icon: <AlertTriangle size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />,
        dot: 'bg-amber-500',
        shadow: 'shadow-amber-100',
        description: 'Average track record, some room for improvement'
      };
    }
    return {
      label: 'Needs Improvement',
      color: 'text-rose-700',
      bg: 'bg-rose-100',
      border: 'border-rose-200',
      icon: <XCircle size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} />,
      dot: 'bg-rose-500',
      shadow: 'shadow-rose-100',
      description: 'Poor track record, buyer caution advised'
    };
  };

  // Size configurations
  const sizeConfig = {
    sm: {
      badge: 'px-2 py-0.5 text-[10px]',
      icon: 'w-5 h-5',
      score: 'text-sm',
      label: 'text-[10px]'
    },
    md: {
      badge: 'px-3 py-1 text-xs',
      icon: 'w-7 h-7',
      score: 'text-base',
      label: 'text-xs'
    },
    lg: {
      badge: 'px-4 py-1.5 text-sm',
      icon: 'w-9 h-9',
      score: 'text-lg',
      label: 'text-sm'
    }
  };

  const config = getBadgeConfig(score);
  const sizes = sizeConfig[size] || sizeConfig.md;

  // Format score for display
  const displayScore = Math.round(score);

  // Get score bar color
  const getBarColor = (score) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  // Get star rating (1-5)
  const getStarRating = (score) => {
    if (score >= 90) return 5;
    if (score >= 70) return 4;
    if (score >= 50) return 3;
    if (score >= 30) return 2;
    return 1;
  };

  const stars = getStarRating(score);

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bg} ${config.border} border ${config.color} ${className}`}
        onMouseEnter={() => onHover && onHover(true)}
        onMouseLeave={() => onHover && onHover(false)}
      >
        <span className={sizes.icon}>{config.icon}</span>
        <span className={`font-semibold ${sizes.score}`}>{displayScore}%</span>
        <span className={`font-medium ${sizes.label}`}>{config.label}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/80 backdrop-blur-sm rounded-xl border ${config.border} shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div 
        className={`p-4 cursor-pointer ${showDetails ? '' : 'hover:bg-[#F8F6F0]/50 transition-colors'}`}
        onClick={() => showDetails && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`${sizes.icon} rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${sizes.score} ${config.color}`}>
                    {displayScore}%
                  </span>
                  <span className={`font-medium ${sizes.label} ${config.color}`}>
                    {config.label}
                  </span>
                </div>
                {shopName && (
                  <p className="text-xs text-[#A0A0B0]">{shopName}</p>
                )}
              </div>
              {showDetails && (
                <button className="p-1 rounded-lg hover:bg-[#F5F3EF] transition-colors">
                  {expanded ? <ChevronUp size={16} className="text-[#A0A0B0]" /> : <ChevronDown size={16} className="text-[#A0A0B0]" />}
                </button>
              )}
            </div>

            {/* Star Rating */}
            <div className="flex items-center gap-0.5 mt-1">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={i < stars ? 'text-amber-400' : 'text-[#EEECE6]'}>
                  ★
                </span>
              ))}
              <span className="text-[10px] text-[#A0A0B0] ml-1">
                ({stars}/5)
              </span>
            </div>

            {/* Score Bar */}
            <div className="mt-2">
              <div className="h-1.5 bg-[#F5F3EF] rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getBarColor(score)} rounded-full transition-all duration-1000`}
                  style={{ width: `${Math.min(100, score)}%` }}
                />
              </div>
            </div>

            {/* Description */}
            <p className="text-[10px] text-[#A0A0B0] mt-1">
              {config.description}
            </p>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && expanded && metrics && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 border-t border-[#EEECE6] space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#F8F6F0] rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-[#A0A0B0]">
                    <Clock size={12} />
                    Avg Response
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A2E]">
                    {metrics.avg_response_time || 'N/A'}
                  </p>
                </div>
                <div className="bg-[#F8F6F0] rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-[#A0A0B0]">
                    <CheckCircle size={12} />
                    Completion Rate
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A2E]">
                    {metrics.completion_rate ? `${Math.round(metrics.completion_rate * 100)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-[#F8F6F0] rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-[#A0A0B0]">
                    <Award size={12} />
                    Selection Rate
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A2E]">
                    {metrics.selection_rate ? `${Math.round(metrics.selection_rate * 100)}%` : 'N/A'}
                  </p>
                </div>
                <div className="bg-[#F8F6F0] rounded-lg p-2 text-center">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-[#A0A0B0]">
                    <TrendingUp size={12} />
                    Total Bids
                  </div>
                  <p className="text-xs font-semibold text-[#1A1A2E]">
                    {metrics.total_bids || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ReliabilityBadge;