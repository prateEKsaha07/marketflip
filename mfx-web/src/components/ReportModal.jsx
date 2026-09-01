import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  X, 
  AlertTriangle, 
  Flag, 
  Loader2, 
  CheckCircle,
  AlertCircle,
  Send
} from 'lucide-react';
import api from '../api/client';

const ReportModal = ({ 
  isOpen, 
  onClose, 
  targetType, 
  targetId, 
  targetName = '',
  onSuccess 
}) => {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const reasons = [
    { value: 'spam', label: 'Spam or misleading' },
    { value: 'inappropriate', label: 'Inappropriate content' },
    { value: 'scam', label: 'Scam or fraud' },
    { value: 'offensive', label: 'Offensive language' },
    { value: 'duplicate', label: 'Duplicate listing' },
    { value: 'other', label: 'Other' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/reports', {
        target_type: targetType,
        target_id: targetId,
        reason: reason,
        description: description
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      console.error('Report error:', err);
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-[#EEECE6] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#EEECE6]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center">
                  <Flag size={16} className="text-rose-600" />
                </div>
                <h2 className="text-sm font-semibold text-[#1A1A2E]">Report</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-[#F5F3EF] transition-colors"
              >
                <X size={18} className="text-[#A0A0B0]" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4">
              {success ? (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle size={24} className="text-emerald-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-emerald-700">Report Submitted</h3>
                  <p className="text-xs text-[#A0A0B0] mt-1">
                    Thank you for helping keep the community safe. We'll review this shortly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {targetName && (
                    <div className="mb-4 p-3 bg-[#F8F6F0] rounded-lg">
                      <p className="text-xs text-[#A0A0B0]">Reporting:</p>
                      <p className="text-sm font-medium text-[#1A1A2E]">{targetName}</p>
                    </div>
                  )}

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-[#A0A0B0] mb-1.5">
                      Reason <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-[#F8F6F0] border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                    >
                      <option value="">Select a reason...</option>
                      {reasons.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-xs font-medium text-[#A0A0B0] mb-1.5">
                      Additional Details <span className="text-[#A0A0B0]">(optional)</span>
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide more context about the issue..."
                      rows={3}
                      className="w-full px-3 py-2 text-sm bg-[#F8F6F0] border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
                      <AlertCircle size={14} className="text-rose-600" />
                      <p className="text-xs text-rose-700">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={onClose}
                      variant="outline"
                      className="flex-1 border-[#EEECE6] text-[#A0A0B0] hover:bg-[#F5F3EF] text-sm py-2 h-auto"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !reason}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-sm py-2 h-auto flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                      Submit Report
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;