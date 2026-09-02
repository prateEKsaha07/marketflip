import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  TrendingUp as TrendingNeutral,
  Calendar,
  MapPin,
  Package,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BarChart3,
  LineChart,
  Clock,
  Award,
  AlertCircle
} from 'lucide-react';

const DemandInsights = ({ 
  forecast = null,
  currentDemand = 0,
  trend = 'stable',
  category = '',
  pincode = '',
  loading = false,
  showDetails = false,
  compact = false,
  className = '',
  onRefresh = null
}) => {
  const [expanded, setExpanded] = useState(false);

  // Get trend indicator
  const getTrendConfig = (trend) => {
    switch(trend) {
      case 'increasing':
        return { 
          icon: <TrendingUp size={16} className="text-emerald-600" />,
          label: 'Increasing Demand',
          color: 'text-emerald-700',
          bg: 'bg-emerald-100',
          direction: 'up'
        };
      case 'decreasing':
        return { 
          icon: <TrendingDown size={16} className="text-rose-600" />,
          label: 'Decreasing Demand',
          color: 'text-rose-700',
          bg: 'bg-rose-100',
          direction: 'down'
        };
      default:
        return { 
          icon: <TrendingNeutral size={16} className="text-amber-600" />,
          label: 'Stable Demand',
          color: 'text-amber-700',
          bg: 'bg-amber-100',
          direction: 'stable'
        };
    }
  };

  const trendConfig = getTrendConfig(trend);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  // Get demand level label
  const getDemandLevel = (demand) => {
    if (demand >= 10) return { label: 'Very High', emoji: '🔥', color: 'text-rose-600' };
    if (demand >= 7) return { label: 'High', emoji: '📈', color: 'text-amber-600' };
    if (demand >= 4) return { label: 'Medium', emoji: '📊', color: 'text-blue-600' };
    if (demand >= 1) return { label: 'Low', emoji: '📉', color: 'text-emerald-600' };
    return { label: 'Very Low', emoji: '⏸️', color: 'text-[#A0A0B0]' };
  };

  const demandLevel = getDemandLevel(currentDemand);

  // Generate forecast chart data
  const getChartData = (forecastData) => {
    if (!forecastData || forecastData.length === 0) return [];
    return forecastData.map(item => ({
      day: formatDate(item.date),
      demand: item.predicted_demand,
      lower: item.confidence_interval?.lower || 0,
      upper: item.confidence_interval?.upper || 0
    }));
  };

  const chartData = getChartData(forecast?.forecast);

  // Calculate max for chart scaling
  const maxDemand = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.upper || d.demand)) + 1
    : 10;

  if (loading) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#EEECE6] animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#F5F3EF]" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-[#F5F3EF] rounded" />
            <div className="h-3 w-20 bg-[#F5F3EF] rounded mt-1" />
          </div>
        </div>
      </div>
    );
  }

  if (!forecast && currentDemand === 0) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-[#EEECE6] text-center ${className}`}>
        <Package size={24} className="text-[#A0A0B0] mx-auto mb-2 opacity-30" />
        <p className="text-sm text-[#A0A0B0]">No demand data available</p>
        <p className="text-xs text-[#A0A0B0]">Check back when there's more activity</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-[#EEECE6] ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg ${trendConfig.bg} flex items-center justify-center`}>
              {trendConfig.icon}
            </div>
            <div>
              <p className="text-xs font-medium text-[#1A1A2E]">
                {category || 'Overall'} Demand
              </p>
              <p className="text-[10px] text-[#A0A0B0]">
                {currentDemand} requests · {trendConfig.label}
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold ${trendConfig.color}`}>
            {trendConfig.direction === 'up' ? '+' : ''}{currentDemand > 0 ? Math.round((currentDemand / 10) * 100) : 0}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/80 backdrop-blur-sm rounded-xl border border-[#EEECE6] shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div 
        className={`p-4 ${showDetails ? 'cursor-pointer' : ''}`}
        onClick={() => showDetails && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg ${trendConfig.bg} flex items-center justify-center flex-shrink-0`}>
            {trendConfig.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[#1A1A2E]">
                    {category ? `${category} Demand` : 'Overall Demand'}
                  </span>
                  {pincode && (
                    <span className="flex items-center gap-1 text-[10px] text-[#A0A0B0]">
                      <MapPin size={10} />
                      {pincode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-bold text-[#1A1A2E]">
                    {currentDemand}
                  </span>
                  <span className="text-xs text-[#A0A0B0]">current requests</span>
                  <span className={`text-xs font-medium ${trendConfig.color} flex items-center gap-1`}>
                    {trendConfig.icon}
                    {trendConfig.label}
                  </span>
                </div>
              </div>
              {showDetails && (
                <button className="p-1 rounded-lg hover:bg-[#F5F3EF] transition-colors">
                  {expanded ? <ChevronUp size={16} className="text-[#A0A0B0]" /> : <ChevronDown size={16} className="text-[#A0A0B0]" />}
                </button>
              )}
            </div>

            {/* Demand Level Badge */}
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-[10px] font-medium ${demandLevel.color}`}>
                {demandLevel.emoji} {demandLevel.label} Demand
              </span>
              {onRefresh && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRefresh();
                  }}
                  className="text-[10px] text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors"
                >
                  ↻ Refresh
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        {forecast?.forecast && forecast.forecast.length > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="bg-[#F8F6F0] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#A0A0B0]">Next 7 Days</p>
              <p className="text-xs font-semibold text-[#1A1A2E]">
                {forecast.forecast.reduce((sum, f) => sum + f.predicted_demand, 0)}
              </p>
            </div>
            <div className="bg-[#F8F6F0] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#A0A0B0]">Daily Avg</p>
              <p className="text-xs font-semibold text-[#1A1A2E]">
                {Math.round(forecast.forecast.reduce((sum, f) => sum + f.predicted_demand, 0) / forecast.forecast.length)}
              </p>
            </div>
            <div className="bg-[#F8F6F0] rounded-lg p-2 text-center">
              <p className="text-[9px] text-[#A0A0B0]">Peak Day</p>
              <p className="text-xs font-semibold text-[#1A1A2E]">
                {Math.max(...forecast.forecast.map(f => f.predicted_demand))}
              </p>
            </div>
          </div>
        )}

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && expanded && chartData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 pt-4 border-t border-[#EEECE6]"
            >
              {/* Forecast Chart */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] font-medium text-[#A0A0B0]">7-Day Forecast</p>
                  <span className="text-[9px] text-[#A0A0B0]">Confidence interval shown</span>
                </div>
                <div className="relative h-32 bg-[#F8F6F0] rounded-lg p-2">
                  {/* Chart bars */}
                  <div className="flex items-end justify-between h-full gap-1">
                    {chartData.map((item, index) => {
                      const heightPercent = maxDemand > 0 ? (item.demand / maxDemand) * 100 : 0;
                      const lowerPercent = maxDemand > 0 ? (item.lower / maxDemand) * 100 : 0;
                      const upperPercent = maxDemand > 0 ? (item.upper / maxDemand) * 100 : 0;
                      
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center gap-1">
                          <div className="relative w-full flex flex-col items-center">
                            {/* Confidence interval bar */}
                            <div 
                              className="absolute bottom-0 w-2/3 bg-[#FFDDB0] rounded-full opacity-30"
                              style={{ 
                                height: `${upperPercent - lowerPercent}%`,
                                bottom: `${lowerPercent}%`
                              }}
                            />
                            {/* Main bar */}
                            <motion.div 
                              initial={{ height: 0 }}
                              animate={{ height: `${heightPercent}%` }}
                              transition={{ duration: 0.5, delay: index * 0.05 }}
                              className={`w-2/3 rounded-full ${heightPercent > 0 ? 'bg-[#FFBE91]' : 'bg-[#EEECE6]'}`}
                              style={{ minHeight: heightPercent > 0 ? '4px' : '0' }}
                            />
                          </div>
                          <span className="text-[8px] text-[#A0A0B0] mt-1">
                            {item.day}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Forecast Details */}
              <div className="mt-3 space-y-1.5">
                {chartData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <span className="text-[#A0A0B0]">{item.day}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-[#A0A0B0]">
                        {item.lower} - {item.upper}
                      </span>
                      <span className="font-medium text-[#1A1A2E]">
                        {item.demand}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default DemandInsights;