import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Bookmark, 
  Search, 
  X, 
  Loader2, 
  AlertCircle,
  Clock,
  ChevronRight,
  Trash2
} from 'lucide-react';
import api from '../api/client';

const SavedSearchesList = ({ limit = 5, showViewAll = true }) => {
  const navigate = useNavigate();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/saved-searches');
      setSearches(response.data || []);
    } catch (err) {
      console.error('Failed to fetch saved searches:', err);
      setError('Failed to load saved searches');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (searchId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this saved search?')) return;

    setDeleting(searchId);
    try {
      await api.delete(`/saved-searches/${searchId}`);
      setSearches(prev => prev.filter(s => s.id !== searchId));
    } catch (err) {
      console.error('Failed to delete saved search:', err);
      alert('Failed to delete saved search');
    } finally {
      setDeleting(null);
    }
  };

  const handleSearchClick = (search) => {
    // Navigate to browse with the saved search params
    const params = new URLSearchParams(search.search_params);
    const role = localStorage.getItem('role');
    const path = role === 'buyer' ? '/buyer/auctions/browse' : '/shop/browse';
    navigate(`${path}?${params.toString()}`);
  };

  const displayedSearches = limit ? searches.slice(0, limit) : searches;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 size={20} className="animate-spin text-[#A0A0B0]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <AlertCircle size={20} className="text-rose-500 mx-auto mb-1" />
        <p className="text-xs text-rose-600">{error}</p>
        <button 
          onClick={fetchSavedSearches}
          className="text-xs text-[#FFBE91] hover:text-[#FFA87A] mt-1"
        >
          Try again
        </button>
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="text-center py-6">
        <Bookmark size={24} className="text-[#A0A0B0] mx-auto mb-2 opacity-30" />
        <p className="text-sm text-[#A0A0B0]">No saved searches</p>
        <p className="text-xs text-[#A0A0B0]">Save a search to quickly find what you're looking for</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {displayedSearches.map((search, index) => (
        <motion.div
          key={search.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleSearchClick(search)}
          className="group flex items-center justify-between p-3 bg-white rounded-lg border border-[#EEECE6] hover:border-[#FFDDB0] hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#FFFCE1] flex items-center justify-center flex-shrink-0">
              <Search size={14} className="text-[#FFBE91]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1A1A2E] truncate">
                {search.name}
              </p>
              <div className="flex items-center gap-2 text-[10px] text-[#A0A0B0]">
                <span className="flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(search.created_at).toLocaleDateString()}
                </span>
                {search.search_params?.category && (
                  <span className="text-[#A0A0B0]">
                    · {search.search_params.category}
                  </span>
                )}
                {search.search_params?.pincode && (
                  <span className="text-[#A0A0B0]">
                    · 📍 {search.search_params.pincode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => handleDelete(search.id, e)}
              disabled={deleting === search.id}
              className="p-1.5 rounded-lg hover:bg-rose-50 text-[#A0A0B0] hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Delete"
            >
              {deleting === search.id ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
            <ChevronRight size={14} className="text-[#A0A0B0] group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.div>
      ))}

      {showViewAll && searches.length > limit && (
        <button
          onClick={() => {
            const role = localStorage.getItem('role');
            navigate(role === 'buyer' ? '/buyer/saved-searches' : '/shop/saved-searches');
          }}
          className="text-xs text-[#A0A0B0] hover:text-[#1A1A2E] transition-colors flex items-center justify-center gap-1 w-full py-2"
        >
          View all {searches.length} saved searches
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
};

export default SavedSearchesList;