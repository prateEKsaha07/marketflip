import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Store, Sparkles } from 'lucide-react';

const ProfileLayout = ({ children, title, subtitle, role, backPath }) => {
  const navigate = useNavigate();

  const isShopOwner = role === 'shop_owner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-6"
        >
          <Button 
            onClick={() => navigate(backPath)}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-xs px-3 py-1.5 h-auto"
          >
            <ArrowLeft size={14} className="mr-1.5" />
            {isShopOwner ? 'Dashboard' : 'Dashboard'}
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A2E] flex items-center gap-2">
              {isShopOwner ? (
                <Store size={20} className="text-[#FFBE91]" />
              ) : (
                <User size={20} className="text-[#FFBE91]" />
              )}
              {title}
            </h1>
            <p className="text-xs text-[#A0A0B0] mt-0.5">{subtitle}</p>
          </div>
        </motion.div>

        {children}
      </div>
    </div>
  );
};

export default ProfileLayout;