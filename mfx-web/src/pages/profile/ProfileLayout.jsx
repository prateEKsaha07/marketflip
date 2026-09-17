import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Store, Sparkles } from 'lucide-react';

const ProfileLayout = ({ children, title, subtitle, role, backPath }) => {
  const navigate = useNavigate();

  const isShopOwner = role === 'shop_owner';

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-3 sm:p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6"
        >
          <Button 
            onClick={() => navigate(backPath)}
            variant="ghost"
            className="text-[#A0A0B0] hover:text-[#1A1A2E] hover:bg-[#F5F3EF] text-[11px] px-2 sm:px-3 py-1.5 h-auto flex-shrink-0 -ml-1 sm:ml-0"
          >
            <ArrowLeft size={13} className="mr-1 sm:mr-1.5" />
            Back
          </Button>
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="text-base sm:text-lg md:text-xl font-semibold text-[#1A1A2E] flex items-center gap-1.5 sm:gap-2 truncate">
              {isShopOwner ? (
                <Store size={16} className="text-[#FFBE91] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
              ) : (
                <User size={16} className="text-[#FFBE91] flex-shrink-0 sm:w-[18px] sm:h-[18px]" />
              )}
              <span className="truncate">{title}</span>
            </h1>
            {subtitle && (
              <p className="text-[10px] sm:text-xs text-[#A0A0B0] mt-0.5 truncate">{subtitle}</p>
            )}
          </div>
        </motion.div>

        {children}
      </div>
    </div>
  );
};

export default ProfileLayout;