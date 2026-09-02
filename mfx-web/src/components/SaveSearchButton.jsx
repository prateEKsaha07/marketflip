import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Bookmark, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Save
} from 'lucide-react';
import api from '../api/client';

const SaveSearchButton = ({ searchParams, currentFilters, onSave }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Please enter a name for this search');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/saved-searches', {
        name: name.trim(),
        search_params: searchParams || currentFilters || {}
      });
      
      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setName('');
        if (onSave) onSave();
      }, 1500);
    } catch (err) {
      console.error('Failed to save search:', err);
      setError(err.response?.data?.detail || 'Failed to save search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="border-[#EEECE6] text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto flex items-center gap-1.5"
      >
        <Bookmark size={13} />
        Save Search
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
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
                  <div className="w-8 h-8 rounded-lg bg-[#FFFCE1] flex items-center justify-center">
                    <Bookmark size={16} className="text-[#FFBE91]" />
                  </div>
                  <h2 className="text-sm font-semibold text-[#1A1A2E]">Save Search</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
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
                    <h3 className="text-sm font-semibold text-emerald-700">Search Saved!</h3>
                    <p className="text-xs text-[#A0A0B0] mt-1">
                      You can quickly access this search from your dashboard.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSave}>
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-[#A0A0B0] mb-1.5">
                        Search Name <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (error) setError('');
                        }}
                        placeholder="e.g., Electronics under ₹5000"
                        className="w-full px-3 py-2 text-sm bg-[#F8F6F0] border-2 border-[#EEECE6] rounded-lg focus:outline-none focus:ring-4 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
                        autoFocus
                      />
                      <p className="text-[10px] text-[#A0A0B0] mt-1">
                        Give your search a name to easily find it later.
                      </p>
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
                        onClick={() => setIsOpen(false)}
                        variant="outline"
                        className="flex-1 border-[#EEECE6] text-[#A0A0B0] hover:bg-[#F5F3EF] text-sm py-2 h-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-[#1A1A2E] hover:bg-[#2A2A3E] text-white text-sm py-2 h-auto flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        Save
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SaveSearchButton;