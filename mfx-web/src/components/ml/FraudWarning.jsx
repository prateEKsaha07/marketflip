import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  Shield, 
  XCircle, 
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Flag,
  Info
} from 'lucide-react';

const FraudWarning = ({ 
  isFraud = false,
  confidence = 0,
  riskFactors = [],
  bidData = null,
  showDetails = false,
  compact = false,
  className = '',
  onReport = null,
  onDismiss = null
}) => {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  // Get severity level
  const getSeverity = (confidence) => {
    if (confidence >= 0.8) return { 
      label: 'High Risk', 
      color: 'text-rose-700',
      bg: 'bg-rose-100',
      border: 'border-rose-200',
      icon: <XCircle size={16} />,
      dot: 'bg-rose-500',
      message: 'This bid shows strong signs of fraudulent activity'
    };
    if (confidence >= 0.6) return { 
      label: 'Medium Risk', 
      color: 'text-amber-700',
      bg: 'bg-amber-100',
      border: 'border-amber-200',
      icon: <AlertTriangle size={16} />,
      dot: 'bg-amber-500',
      message: 'This bid shows some signs of suspicious activity'
    };
    if (confidence >= 0.4) return { 
      label: 'Low Risk', 
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      border: 'border-blue-200',
      icon: <AlertCircle size={16} />,
      dot: 'bg-blue-500',
      message: 'This bid has minor red flags'
    };
    return { 
      label: 'Minimal Risk', 
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      border: 'border-emerald-200',
      icon: <Shield size={16} />,
      dot: 'bg-emerald-500',
      message: 'This bid appears legitimate'
    };
  };

  const severity = getSeverity(confidence);
  const isHighRisk = confidence >= 0.6;
  const displayConfidence = Math.round(confidence * 100);

  // Risk factor icons
  const getRiskIcon = (factor) => {
    if (factor.includes('price') || factor.includes('budget')) return <AlertTriangle size={12} className="text-rose-500" />;
    if (factor.includes('response') || factor.includes('time')) return <Clock size={12} className="text-amber-500" />;
    if (factor.includes('volume') || factor.includes('count')) return <TrendingUp size={12} className="text-amber-500" />;
    if (factor.includes('note') || factor.includes('description')) return <FileText size={12} className="text-blue-500" />;
    return <AlertCircle size={12} className="text-amber-500" />;
  };

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${severity.bg} ${severity.border} border ${severity.color} ${className}`}
      >
        {severity.icon}
        <span className="text-[10px] font-medium">{severity.label}</span>
        {displayConfidence > 0 && (
          <span className="text-[9px] opacity-70">({displayConfidence}%)</span>
        )}
      </div>
    );
  }

  // If not fraud and low risk, show minimal badge
  if (!isFraud && confidence < 0.4) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 ${className}`}>
        <CheckCircle size={16} className="text-emerald-600" />
        <span className="text-xs text-emerald-700">This bid appears legitimate</span>
        {onDismiss && (
          <button
            onClick={() => setDismissed(true)}
            className="ml-auto text-[10px] text-emerald-600 hover:text-emerald-700"
          >
            Dismiss
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white/80 backdrop-blur-sm rounded-xl border ${severity.border} shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div 
        className={`p-4 ${showDetails ? 'cursor-pointer' : ''}`}
        onClick={() => showDetails && setExpanded(!expanded)}
      >
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`w-10 h-10 rounded-lg ${severity.bg} flex items-center justify-center flex-shrink-0`}>
            {severity.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-semibold text-sm ${severity.color}`}>
                    {severity.label}
                  </span>
                  {isHighRisk && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-100 text-rose-700">
                      <Flag size={10} />
                      Flagged
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#A0A0B0] mt-0.5">{severity.message}</p>
              </div>
              {showDetails && (
                <button className="p-1 rounded-lg hover:bg-[#F5F3EF] transition-colors">
                  {expanded ? <ChevronUp size={16} className="text-[#A0A0B0]" /> : <ChevronDown size={16} className="text-[#A0A0B0]" />}
                </button>
              )}
            </div>

            {/* Confidence Bar */}
            {confidence > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] text-[#A0A0B0]">
                  <span>Risk Score</span>
                  <span className="font-medium">{displayConfidence}%</span>
                </div>
                <div className="h-1.5 bg-[#F5F3EF] rounded-full overflow-hidden mt-0.5">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      confidence >= 0.8 ? 'bg-rose-500' :
                      confidence >= 0.6 ? 'bg-amber-500' :
                      confidence >= 0.4 ? 'bg-blue-500' :
                      'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, displayConfidence)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Risk Factors */}
            {riskFactors.length > 0 && !expanded && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {riskFactors.slice(0, 2).map((factor, index) => (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] bg-amber-50 text-amber-700 border border-amber-100">
                    <AlertCircle size={10} />
                    {factor}
                  </span>
                ))}
                {riskFactors.length > 2 && (
                  <span className="text-[9px] text-[#A0A0B0]">+{riskFactors.length - 2} more</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {showDetails && expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-3 pt-3 border-t border-[#EEECE6] space-y-3"
            >
              {/* All Risk Factors */}
              {riskFactors.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-[#A0A0B0] mb-1.5">Risk Factors</p>
                  <div className="space-y-1.5">
                    {riskFactors.map((factor, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs text-[#4A4A5A] bg-[#F8F6F0] px-3 py-1.5 rounded-lg">
                        {getRiskIcon(factor)}
                        <span>{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bid Data (if provided) */}
              {bidData && (
                <div>
                  <p className="text-[10px] font-medium text-[#A0A0B0] mb-1.5">Bid Details</p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {Object.entries(bidData).map(([key, value]) => (
                      <div key={key} className="bg-[#F8F6F0] rounded-lg p-2">
                        <span className="text-[#A0A0B0] capitalize">{key.replace(/_/g, ' ')}</span>
                        <p className="font-medium text-[#1A1A2E]">{value || 'N/A'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-2">
                {onReport && (
                  <button
                    onClick={() => onReport()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs rounded-lg transition-colors"
                  >
                    <Flag size={14} />
                    Report
                  </button>
                )}
                {onDismiss && (
                  <button
                    onClick={() => setDismissed(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F5F3EF] hover:bg-[#EEECE6] text-[#A0A0B0] hover:text-[#1A1A2E] text-xs rounded-lg transition-colors"
                  >
                    <EyeOff size={14} />
                    Dismiss
                  </button>
                )}
                <button
                  onClick={() => window.open('/help/reporting', '_blank')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[#A0A0B0] hover:text-[#1A1A2E] text-xs rounded-lg transition-colors"
                >
                  <Info size={14} />
                  Learn More
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// Required imports for Clock, TrendingUp, FileText (if not already imported)
// These should be added to the imports at the top
import { Clock, TrendingUp, FileText } from 'lucide-react';

export default FraudWarning;