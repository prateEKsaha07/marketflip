import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@/components/ui/button';
import { Edit2, Loader2, AlertCircle, Lock, User, Store } from 'lucide-react';
import api from '../../api/client';

const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/auth/profiles/${user?.user_id}`);
      console.log('=== PROFILE DATA ===', response.data);
      setProfile(response.data);
    } catch (err) {
      console.error('Fetch profile error:', err);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const backPath = profile?.role === 'shop_owner' ? '/shop/dashboard' : '/buyer/dashboard';
  const editPath = profile?.role === 'shop_owner' ? '/shop/profile/edit' : '/buyer/profile/edit';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={24} className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-red-50 p-6 rounded-lg">
          <AlertCircle className="text-red-500 mb-2" />
          <p className="text-red-700">{error}</p>
          <Button onClick={() => navigate(backPath)} className="mt-4">
            Dashboard
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const isShopOwner = profile.role === 'shop_owner';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">{isShopOwner ? 'Shop Profile' : 'My Profile'}</h1>
            <p className="text-gray-500 text-sm">{profile.email || user?.email}</p>
          </div>
          <Button
            onClick={() => navigate(editPath)}
            className="flex items-center gap-2"
          >
            <Edit2 size={16} />
            Edit Profile
          </Button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow p-6">
          {/* Profile Photo */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border-2 border-gray-200">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `
                      <div class="w-full h-full flex items-center justify-center">
                        ${isShopOwner ? 
                          '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>'
                          : 
                          '<svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>'
                        }
                      </div>
                    `;
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#FFBE91]/20 to-[#CFEBFF]/20">
                  {isShopOwner ? (
                    <Store size={28} className="text-gray-400" />
                  ) : (
                    <User size={28} className="text-gray-400" />
                  )}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{profile.full_name || 'User'}</h2>
              <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Full Name</label>
              <p className="font-medium">{profile.full_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Role</label>
              <p className="font-medium capitalize">{profile.role}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Phone</label>
              <p className="font-medium">{profile.phone || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase">Pincode</label>
              <p className="font-medium">{profile.pincode || 'Not provided'}</p>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-gray-500 uppercase">Address</label>
              <p className="font-medium">{profile.address || 'Not provided'}</p>
            </div>
            {profile.bio && (
              <div className="col-span-2">
                <label className="text-xs font-medium text-gray-500 uppercase">Bio</label>
                <p className="font-medium">{profile.bio}</p>
              </div>
            )}
          </div>

          {/* Buyer Specific Fields */}
          {!isShopOwner && (
            <>
              <div className="border-t pt-4 mt-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Identity & Trust</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Identity Number</label>
                    <p className="font-medium flex items-center gap-2">
                      {profile.identity_number || 'Not provided'}
                      {profile.identity_number && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock size={12} />
                          Locked
                        </span>
                      )}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Identity Type</label>
                    <p className="font-medium">{profile.identity_type ? profile.identity_type.toUpperCase() : 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Delivery Preferences</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Default Delivery Address</label>
                    <p className="font-medium">{profile.delivery_address || 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">Budget Range Preference</label>
                    <p className="font-medium">
                      {profile.budget_range_preference?.min && profile.budget_range_preference?.max
                        ? `₹${profile.budget_range_preference.min.toLocaleString()} - ₹${profile.budget_range_preference.max.toLocaleString()}`
                        : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Shop Specific Fields */}
          {isShopOwner && (
            <>
              <div className="border-t pt-4 mt-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Shop Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Shop Name</label>
                    <p className="font-medium">{profile.shop_name || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase">Years in Business</label>
                    <p className="font-medium">{profile.years_in_business ? `${profile.years_in_business} years` : 'Not provided'}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-medium text-gray-500 uppercase">GST Number</label>
                    <p className="font-medium flex items-center gap-2">
                      {profile.gst_number || 'Not provided'}
                      {profile.gst_number && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded flex items-center gap-1">
                          <Lock size={12} />
                          Locked
                        </span>
                      )}
                    </p>
                  </div>
                  {profile.business_hours && (
                    <div className="col-span-2">
                      <label className="text-xs font-medium text-gray-500 uppercase">Business Hours</label>
                      <div className="space-y-1">
                        {profile.business_hours.monday_friday && (
                          <p className="font-medium">Mon-Fri: {profile.business_hours.monday_friday}</p>
                        )}
                        {profile.business_hours.saturday && (
                          <p className="font-medium">Sat: {profile.business_hours.saturday}</p>
                        )}
                        {profile.business_hours.sunday && (
                          <p className="font-medium">Sun: {profile.business_hours.sunday}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Stats</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold">{profile.total_transactions || 0}</p>
                    <p className="text-xs text-gray-500">Total Transactions</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold">{profile.completed_transactions || 0}</p>
                    <p className="text-xs text-gray-500">Completed</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded text-center">
                    <p className="text-2xl font-bold">{profile.avg_response_time_minutes ? `${profile.avg_response_time_minutes}m` : 'N/A'}</p>
                    <p className="text-xs text-gray-500">Avg Response</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Debug: Show raw data */}
          <div className="border-t pt-4 mt-4">
            <details className="text-xs">
              <summary className="cursor-pointer text-gray-500 font-medium">Debug: Raw Profile Data</summary>
              <pre className="mt-2 bg-gray-100 p-3 rounded overflow-auto max-h-60">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </details>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-4">
          <Button
            onClick={() => navigate(backPath)}
            variant="ghost"
            className="text-gray-500"
          >
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;