import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Search,
  Package,
  DollarSign,
  MapPin,
  Eye,
  ChevronRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Truck,
  ShieldCheck,
  RefreshCw,
  Calendar,
  TrendingUp,
  Building2,
  Home
} from 'lucide-react';
import api from '../../api/client';

const AuctionHistoryTable = ({ 
  role, // 'shop' or 'buyer'
  auctions = [], 
  loading = false, 
  onRefresh = null,
  title = 'Auction History',
  emptyMessage = 'No auction history found'
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          label: 'Active',
          icon: <Clock size={12} />,
          dot: 'bg-emerald-500'
        };
      case 'sold':
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-700',
          label: 'Sold',
          icon: <Truck size={12} />,
          dot: 'bg-blue-500'
        };
      case 'completed':
        return {
          bg: 'bg-emerald-100',
          text: 'text-emerald-700',
          label: 'Completed',
          icon: <CheckCircle size={12} />,
          dot: 'bg-emerald-500'
        };
      case 'expired':
        return {
          bg: 'bg-rose-100',
          text: 'text-rose-700',
          label: 'Expired',
          icon: <XCircle size={12} />,
          dot: 'bg-rose-500'
        };
      case 'cancelled':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          label: 'Cancelled',
          icon: <AlertCircle size={12} />,
          dot: 'bg-gray-500'
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-700',
          label: status,
          icon: <AlertCircle size={12} />,
          dot: 'bg-gray-500'
        };
    }
  };

  const getDeliveryMethodIcon = (method) => {
    if (method === 'home_delivery') return <Home size={12} />;
    if (method === 'pickup') return <Building2 size={12} />;
    return null;
  };

  const getDeliveryMethodLabel = (method) => {
    if (method === 'home_delivery') return 'Home Delivery';
    if (method === 'pickup') return 'Pickup';
    return 'Not set';
  };

  const filteredAuctions = useMemo(() => {
    let filtered = [...auctions];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(a =>
        a.item_name.toLowerCase().includes(query) ||
        (a.description && a.description.toLowerCase().includes(query))
      );
    }

    if (categoryFilter) {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }

    filtered.sort((a, b) => new Date(b.closed_at || b.created_at) - new Date(a.closed_at || a.created_at));
    return filtered;
  }, [auctions, statusFilter, searchQuery, categoryFilter]);

  // Get counts for filter tabs
  const counts = {
    all: auctions.length,
    active: auctions.filter(a => a.status === 'active').length,
    sold: auctions.filter(a => a.status === 'sold').length,
    completed: auctions.filter(a => a.status === 'completed').length,
    expired: auctions.filter(a => a.status === 'expired').length,
    cancelled: auctions.filter(a => a.status === 'cancelled').length,
  };

  const statusTabs = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'active', label: 'Active', count: counts.active },
    { id: 'sold', label: 'Sold', count: counts.sold },
    { id: 'completed', label: 'Completed', count: counts.completed },
    { id: 'expired', label: 'Expired', count: counts.expired },
    { id: 'cancelled', label: 'Cancelled', count: counts.cancelled },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.03 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeOut" }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="animate-spin text-[#1A1A2E]" />
          <p className="text-xs text-[#A0A0B0]">Loading history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-xl border border-[#EEECE6] overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#EEECE6] flex flex-wrap justify-between items-center gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2">
            <Package size={16} className="text-[#FFBE91]" />
            {title}
          </h2>
          <p className="text-[10px] text-[#A0A0B0] mt-0.5">
            {auctions.length} total records
          </p>
        </div>
        {onRefresh && (
          <Button
            onClick={onRefresh}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1 h-auto"
          >
            <RefreshCw size={13} className="mr-1" />
            Refresh
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-[#EEECE6] space-y-3">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`
                flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all text-[10px] font-medium
                ${statusFilter === tab.id
                  ? 'bg-[#FFBE91] text-[#1A1A2E] shadow-sm'
                  : 'text-[#4A4A5A] hover:text-[#1A1A2E] hover:bg-[#FFDDB0]/30'
                }
              `}
            >
              {tab.label}
              <span className={`
                ml-0.5 px-1.5 py-0.5 rounded-full text-[8px]
                ${statusFilter === tab.id
                  ? 'bg-[#1A1A2E]/10 text-[#1A1A2E]'
                  : 'bg-[#FFDDB0]/30 text-[#4A4A5A]'
                }
              `}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Category */}
        <div className="flex flex-wrap gap-2">
          <div className="flex-1 min-w-[120px] relative">
            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A0A0B0]" />
            <input
              type="text"
              placeholder="Search auctions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 text-[10px] bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-32 px-2.5 py-1.5 text-[10px] bg-white/80 border border-[#EEECE6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFBE91]/20 focus:border-[#FFBE91] transition-all appearance-none"
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="furniture">Furniture</option>
            <option value="clothing">Clothing</option>
            <option value="books">Books</option>
            <option value="home_kitchen">Home & Kitchen</option>
            <option value="vehicles">Vehicles</option>
            <option value="other">Other</option>
          </select>
          <Button
            onClick={() => {
              setSearchQuery('');
              setCategoryFilter('');
              setStatusFilter('all');
            }}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-[10px] px-2.5 py-1.5 h-auto"
          >
            Clear
          </Button>
        </div>
      </div>

      {/* Table */}
      {filteredAuctions.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-10 h-10 rounded-xl bg-[#F5F3EF] flex items-center justify-center mx-auto mb-2">
            <Package size={18} className="text-[#A0A0B0]" />
          </div>
          <h3 className="text-xs font-medium text-[#1A1A2E]">No records found</h3>
          <p className="text-[10px] text-[#A0A0B0] mt-1">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="min-w-full divide-y divide-[#EEECE6]"
          >
            {/* Table Header */}
            <div className="bg-[#F8F6F0] px-4 py-2 flex items-center gap-3 text-[10px] font-medium text-[#A0A0B0]">
              <div className="w-10 flex-shrink-0">#</div>
              <div className="flex-1 min-w-[120px]">Item</div>
              <div className="w-20 flex-shrink-0 text-right">Price</div>
              <div className="w-24 flex-shrink-0 text-center">Status</div>
              <div className="w-24 flex-shrink-0 text-center">Delivery</div>
              <div className="w-28 flex-shrink-0 text-right">Date</div>
              <div className="w-14 flex-shrink-0 text-center">Action</div>
            </div>

            {/* Table Rows */}
            {filteredAuctions.map((auction, index) => {
              const status = getStatusBadge(auction.status);
              const isOverridden = auction.completed_via_override === true;
              const firstImage = auction.image_urls && auction.image_urls.length > 0
                ? auction.image_urls[0]
                : null;

              const detailPath = role === 'shop'
                ? `/shop/auctions/${auction.id}`
                : `/buyer/auctions/${auction.id}`;

              return (
                <motion.div
                  key={auction.id}
                  variants={itemVariants}
                  className="px-4 py-3 flex items-center gap-3 hover:bg-[#F8F6F0]/50 transition-colors group"
                >
                  {/* Index */}
                  <div className="w-10 flex-shrink-0 text-[10px] text-[#A0A0B0]">
                    {index + 1}
                  </div>

                  {/* Item */}
                  <div className="flex-1 min-w-[120px] flex items-center gap-2.5">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={auction.item_name}
                        className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-[#F5F3EF] flex items-center justify-center flex-shrink-0">
                        <Package size={14} className="text-[#A0A0B0]" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#1A1A2E] truncate">
                        {auction.item_name}
                      </div>
                      {auction.category && (
                        <div className="text-[9px] text-[#A0A0B0]">
                          {auction.category}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="w-20 flex-shrink-0 text-right text-xs font-medium text-[#1A1A2E]">
                    ₹{(auction.current_highest_bid || auction.starting_price).toLocaleString()}
                  </div>

                  {/* Status */}
                  <div className="w-24 flex-shrink-0 flex items-center justify-center">
                    <div className="flex items-center gap-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-medium ${status.bg} ${status.text}`}>
                        {status.icon}
                        {status.label}
                      </span>
                      {isOverridden && (
                        <span className="text-amber-500" title="Completed via override">
                          <ShieldCheck size={11} />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="w-24 flex-shrink-0 flex items-center justify-center text-[10px] text-[#4A4A5A]">
                    {auction.delivery_method ? (
                      <span className="flex items-center gap-1">
                        {getDeliveryMethodIcon(auction.delivery_method)}
                        {getDeliveryMethodLabel(auction.delivery_method)}
                      </span>
                    ) : (
                      <span className="text-[#A0A0B0]">—</span>
                    )}
                  </div>

                  {/* Date */}
                  <div className="w-28 flex-shrink-0 text-right text-[10px] text-[#A0A0B0]">
                    {new Date(auction.closed_at || auction.created_at).toLocaleDateString()}
                  </div>

                  {/* Action */}
                  <div className="w-14 flex-shrink-0 flex justify-center">
                    <Button
                      onClick={() => navigate(detailPath)}
                      variant="ghost"
                      className="text-[#A0A0B0] hover:text-[#1A1A2E] text-[10px] px-2 py-1 h-auto"
                    >
                      <Eye size={13} />
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#EEECE6] text-[9px] text-[#A0A0B0] flex justify-between">
        <span>Showing {filteredAuctions.length} of {auctions.length} records</span>
        <span>Role: {role === 'shop' ? 'Shop Owner' : 'Buyer'}</span>
      </div>
    </div>
  );
};

export default AuctionHistoryTable;