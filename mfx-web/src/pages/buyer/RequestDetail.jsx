import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Clock,
  Calendar,
  MapPin,
  Tag,
  ShoppingBag,
  User,
  Phone,
  Home,
  Store,
  Check,
  AlertCircle
} from 'lucide-react';
import api from '../../api/client';

const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [request, setRequest] = useState(null);
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selecting, setSelecting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [selectedBidInfo, setSelectedBidInfo] = useState(null);
  const [showSuccessCard, setShowSuccessCard] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetchRequestDetail();
  }, [id]);

  const fetchRequestDetail = async () => {
    setLoading(true);
    setError('');
    setNotFound(false);
    
    try {
      const requestResponse = await api.get(`/requests/${id}`);
      console.log('Request detail:', requestResponse.data);
      setRequest(requestResponse.data);

      if (user?.role === 'buyer') {
        await fetchBids();
      }
    } catch (err) {
      console.error('Fetch request error:', err);
      if (err.response?.status === 404) {
        setNotFound(true);
        setError('Request not found. It may have been deleted or never existed.');
      } else {
        setError('Failed to fetch request details: ' + (err.response?.data?.detail || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchBids = async () => {
    try {
      const response = await api.get(`/requests/${id}/bids`);
      console.log('Bids:', response.data);
      setBids(response.data);
    } catch (err) {
      console.error('Failed to fetch bids:', err);
    }
  };

  const handleSelectBid = async (bidId) => {
    if (!window.confirm('Are you sure you want to select this bid?')) return;
    
    setSelecting(true);
    try {
      console.log('Selecting bid:', bidId);
      const response = await api.patch(`/bids/${bidId}/select`);
      console.log('Bid selected response:', response.data);
      
      const data = response.data;
      
      setSelectedBidInfo({
        bidId: data.bid_id,
        requestId: data.request_id,
        status: data.status,
        price: data.selected_bid?.price || 'N/A',
        shopName: data.shop_contact?.name || 'Unknown',
        shopPhone: data.shop_contact?.phone || 'N/A',
        shopAddress: data.shop_contact?.address || 'N/A',
        note: data.selected_bid?.note || 'No note',
        selectedAt: data.selected_bid?.selected_at || new Date().toISOString()
      });
      setShowSuccessCard(true);
      
      setRequest(prev => prev ? { ...prev, status: 'purchased' } : null);
      
      setBids(prev => prev.map(bid => 
        bid.id === bidId 
          ? { ...bid, status: 'selected' }
          : bid.status === 'pending' 
            ? { ...bid, status: 'rejected' }
            : bid
      ));
      
    } catch (err) {
      console.error('Select bid error:', err);
      const errorMsg = err.response?.data?.detail || 'Unknown error';
      alert(`❌ Failed to select bid: ${errorMsg}`);
    } finally {
      setSelecting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    
    setDeleting(true);
    try {
      await api.delete(`/requests/${id}`);
      alert('✅ Request deleted successfully');
      navigate('/buyer/dashboard');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Unknown error';
      alert(`❌ Failed to delete request: ${errorMsg}`);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open': return { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Clock size={14} /> };
      case 'purchased': return { bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle size={14} /> };
      case 'completed': return { bg: 'bg-violet-50 text-violet-700 border-violet-200', icon: <Check size={14} /> };
      case 'expired': return { bg: 'bg-rose-50 text-rose-700 border-rose-200', icon: <AlertCircle size={14} /> };
      case 'deleted': return { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: <XCircle size={14} /> };
      default: return { bg: 'bg-gray-50 text-gray-700 border-gray-200', icon: <Clock size={14} /> };
    }
  };

  const getBidStatusBadge = (status) => {
    switch(status) {
      case 'selected': return { bg: 'bg-emerald-100 text-emerald-700', label: 'Selected ✓' };
      case 'rejected': return { bg: 'bg-rose-100 text-rose-700', label: 'Rejected ✗' };
      case 'pending': return { bg: 'bg-amber-100 text-amber-700', label: 'Pending ⏳' };
      default: return { bg: 'bg-gray-100 text-gray-700', label: status };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCE1]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#FFBE91] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#FFBE91] font-medium animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound || error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCE1] p-4">
        <Card className="max-w-md w-full text-center p-8 border-rose-200 bg-rose-50/50">
          <div className="text-5xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-rose-700">Request Not Found</h2>
          <p className="text-rose-600 mt-2">The request you're looking for doesn't exist or has been removed.</p>
          <Button 
            onClick={() => navigate('/buyer/dashboard')}
            className="mt-6 bg-[#FFBE91] hover:bg-[#FFA87A] text-[#1A1A2E]"
          >
            <ArrowLeft size={18} className="mr-2" />
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  if (!request) return null;

  const isOwner = request.buyer_id === user?.user_id;
  const isPurchased = request.status === 'purchased' || showSuccessCard;
  const isOpen = request.status === 'open' && !showSuccessCard;
  const statusBadge = getStatusBadge(request.status);

  return (
    <div className="min-h-screen bg-[#FFFCE1] p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/buyer/dashboard')}
              className="text-[#4A4A5A] hover:text-[#FFBE91] hover:bg-[#FFBE91]/10"
            >
              <ArrowLeft size={18} className="mr-2" />
              Back
            </Button>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A2E]">Request Details</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOwner && isOpen && (
              <Button 
                onClick={() => navigate(`/buyer/edit-request/${id}`)}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-400"
              >
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
            )}
            <Button 
              onClick={() => navigate('/buyer/dashboard')}
              variant="outline"
              className="border-[#FFDDB0] text-[#4A4A5A] hover:bg-[#FFDDB0]/30"
            >
              Dashboard
            </Button>
          </div>
        </div>

        {/* Success Card */}
        {showSuccessCard && selectedBidInfo && (
          <Card className="mb-6 border-emerald-400 bg-emerald-50/80 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-emerald-800">🎉 Purchase Finalized!</h3>
                  <p className="text-emerald-700 text-sm">Your bid has been selected successfully. The request is now marked as purchased.</p>
                  
                  <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-200">
                    <h4 className="font-semibold text-[#1A1A2E] mb-2 flex items-center gap-2">
                      <Store size={18} className="text-[#FFBE91]" />
                      Shop Contact Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-[#4A4A5A]">Shop:</span>
                        <span className="font-medium text-[#1A1A2E] ml-2">{selectedBidInfo.shopName}</span>
                      </div>
                      <div>
                        <span className="text-[#4A4A5A]">Phone:</span>
                        <span className="font-medium text-[#1A1A2E] ml-2">{selectedBidInfo.shopPhone}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[#4A4A5A]">Address:</span>
                        <span className="font-medium text-[#1A1A2E] ml-2">{selectedBidInfo.shopAddress}</span>
                      </div>
                      <div>
                        <span className="text-[#4A4A5A]">Price:</span>
                        <span className="font-medium text-emerald-600 ml-2">₹{selectedBidInfo.price}</span>
                      </div>
                      <div>
                        <span className="text-[#4A4A5A]">Selected On:</span>
                        <span className="font-medium text-[#1A1A2E] ml-2">
                          {new Date(selectedBidInfo.selectedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[#4A4A5A]">Note:</span>
                        <span className="text-[#1A1A2E] ml-2">{selectedBidInfo.note}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Info Card */}
        <Card className="mb-6 border-[#FFDDB0]/50 shadow-sm">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#1A1A2E]">{request.item_name}</h2>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className={`
                    inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border
                    ${statusBadge.bg}
                  `}>
                    {statusBadge.icon}
                    {request.status.toUpperCase()}
                  </span>
                  <span className="text-sm text-[#4A4A5A] flex items-center gap-1">
                    <Calendar size={14} />
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-[#4A4A5A] flex items-center gap-1">
                    <Clock size={14} />
                    Expires: {new Date(request.expires_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#FFDDB0]/30">
              <div>
                <p className="text-sm text-[#4A4A5A]">Description</p>
                <p className="text-[#1A1A2E]">{request.description || 'No description provided'}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-sm text-[#4A4A5A]">Budget</p>
                  <p className="text-[#1A1A2E] font-medium">
                    ₹{request.budget_min.toLocaleString()} - ₹{request.budget_max.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A5A]">Pincode</p>
                  <p className="text-[#1A1A2E] font-medium flex items-center gap-1">
                    <MapPin size={14} className="text-[#4A4A5A]" />
                    {request.pincode}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A5A]">Category</p>
                  <p className="text-[#1A1A2E] font-medium flex items-center gap-1">
                    <Tag size={14} className="text-[#4A4A5A]" />
                    {request.category}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A5A]">Status</p>
                  <p className={`font-medium ${isPurchased ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {isPurchased ? 'Purchased' : 'Open'}
                  </p>
                </div>
              </div>
            </div>

            {isOwner && isOpen && (
              <div className="mt-4 pt-4 border-t border-[#FFDDB0]/30">
                <Button 
                  onClick={handleDeleteRequest}
                  disabled={deleting}
                  variant="destructive"
                  size="sm"
                  className="bg-rose-500 hover:bg-rose-600"
                >
                  <Trash2 size={16} className="mr-2" />
                  {deleting ? 'Deleting...' : 'Delete Request'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bids Section */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#FFBE91]" />
            Bids ({bids.length || 0})
          </h3>
        </div>

        {!isOwner ? (
          <Card className="bg-amber-50/50 border-amber-200">
            <CardContent className="p-6 text-center text-amber-700">
              <p>Only the buyer can view bids on this request</p>
            </CardContent>
          </Card>
        ) : bids.length === 0 ? (
          <Card className="bg-gray-50/50 border-gray-200">
            <CardContent className="p-6 text-center text-[#4A4A5A]">
              <p>No bids yet. Wait for shop owners to bid on your request.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bids.map((bid) => {
              const bidStatus = getBidStatusBadge(bid.status);
              const isSelected = bid.status === 'selected';
              const isRejected = bid.status === 'rejected';
              const isPending = bid.status === 'pending';

              return (
                <Card 
                  key={bid.id}
                  className={`
                    border-l-4 transition-all hover:shadow-md
                    ${isSelected ? 'border-l-emerald-400 bg-emerald-50/30' : 
                      isRejected ? 'border-l-rose-400 bg-rose-50/30' : 
                      'border-l-amber-400 bg-white'}
                  `}
                >
                  <CardContent className="p-5">
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <span className="font-semibold text-[#1A1A2E]">₹{bid.price}</span>
                          <span className={`
                            px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${bidStatus.bg}
                          `}>
                            {bidStatus.label}
                          </span>
                        </div>
                        <p className="text-sm text-[#4A4A5A]">
                          <span className="font-medium">Shop:</span> {bid.profiles?.shop_name || bid.shop_name || 'Unknown Shop'}
                        </p>
                        <p className="text-sm text-[#4A4A5A]">
                          <span className="font-medium">Note:</span> {bid.note || 'No note'}
                        </p>
                        <p className="text-xs text-[#4A4A5A] mt-1">
                          Placed: {new Date(bid.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isOpen && isPending && (
                          <Button
                            onClick={() => handleSelectBid(bid.id)}
                            disabled={selecting}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg transition-all"
                            size="sm"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            {selecting ? 'Selecting...' : 'Select Bid'}
                          </Button>
                        )}
                        {isSelected && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                            <Check size={16} />
                            Selected
                          </div>
                        )}
                        {isRejected && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-100 text-rose-700 rounded-full text-sm font-medium">
                            <XCircle size={16} />
                            Rejected
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestDetail;