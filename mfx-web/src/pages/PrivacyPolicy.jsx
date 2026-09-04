import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Database, MessageSquare, MapPin, User, Clock, CheckCircle } from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <Button 
            onClick={() => navigate(-1)}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] text-xs px-3 py-1.5 h-auto"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
            <Shield size={20} className="text-[#FFBE91]" />
            Privacy Policy
          </h1>
        </motion.div>

        {/* Content */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-[#EEECE6] space-y-6"
        >
          <div className="text-xs text-[#A0A0B0] border-b border-[#EEECE6] pb-3">
            Last updated: September 4, 2026
          </div>

          {/* Section 1 */}
          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <Eye size={16} className="text-[#FFBE91]" />
              1. Information We Collect
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p><strong>Account Information:</strong> Email, password, role (buyer/shop owner)</p>
              <p><strong>Profile Information (optional):</strong> Full name, date of birth, gender, profile photo, bio</p>
              <p><strong>Shop Information (shop owners only):</strong> Shop name, address, pincode, phone, GST number, business hours, years in business</p>
              <p><strong>Buyer Information (buyers only):</strong> Delivery address, budget preferences, preferred categories</p>
              <p><strong>Transaction Data:</strong> Requests, bids, auctions, purchases, delivery confirmations</p>
              <p><strong>Communications:</strong> Chat messages between matched parties</p>
              <p><strong>Behavioral Data:</strong> Views, clicks, search history, saved searches, favorites</p>
              <p><strong>Location:</strong> Pincode (for matching buyers with local shops)</p>
            </div>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <Database size={16} className="text-[#FFBE91]" />
              2. How We Use Your Information
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> To connect buyers with local shops</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> To process transactions and deliveries</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> To provide chat functionality between matched parties</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> To improve our services and user experience</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> To detect and prevent fraud</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> To generate recommendations and insights (ML features)</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> To send transaction-related notifications</p>
            </div>
          </section>

          {/* Section 3 */}
          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <User size={16} className="text-[#FFBE91]" />
              3. Information Sharing
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p><strong>Between Buyers & Shops:</strong> Contact information (phone, address) is only shared <strong>after</strong> a bid is selected or auction is won.</p>
              <p><strong>Public Information:</strong> Shop name, shop address, and pincode are visible to all users.</p>
              <p><strong>Personal Information:</strong> Date of birth, gender, email, phone (of buyers) are <strong>never</strong> publicly visible.</p>
              <p><strong>Chat Messages:</strong> Only visible to the two parties involved in the conversation.</p>
              <p><strong>Reviews:</strong> Visible to all users (rating + comment), reviewer identity is shown.</p>
            </div>
          </section>

          {/* Section 4 */}
          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <Shield size={16} className="text-[#FFBE91]" />
              4. Data Security
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> All passwords are hashed via Supabase Auth</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> Row Level Security (RLS) restricts data access</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> Chat messages are only accessible to matched parties</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> Personal information is only accessible to the owner</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> All data is stored securely in Supabase PostgreSQL</p>
            </div>
          </section>

          {/* Section 5 */}
          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <Clock size={16} className="text-[#FFBE91]" />
              5. Data Retention
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p>✓ Account data is retained until you delete your account</p>
              <p>✓ Transaction history is retained for record-keeping</p>
              <p>✓ Chat messages are retained for the lifetime of the account</p>
              <p>✓ You may request data deletion at any time</p>
            </div>
          </section>

          {/* Section 6 */}
          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-[#FFBE91]" />
              6. Your Rights
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p>✓ Access your personal data</p>
              <p>✓ Correct inaccurate data</p>
              <p>✓ Delete your account and associated data</p>
              <p>✓ Opt out of optional data collection (DOB, gender, preferences)</p>
            </div>
          </section>

          {/* Section 7 */}
          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-[#FFBE91]" />
              7. Contact Us
            </h2>
            <div className="text-xs text-[#4A4A5A] pl-6">
              <p>For privacy concerns or data requests, contact: <strong>support@marketflip.com</strong></p>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-[#EEECE6] pt-3 text-[10px] text-[#A0A0B0]">
            <p>By using MarketFlip, you consent to this privacy policy.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;