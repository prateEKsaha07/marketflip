import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F8F6F0] via-white to-[#F8F6F0] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
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
            <FileText size={20} className="text-[#FFBE91]" />
            Terms of Service
          </h1>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-xl p-6 border border-[#EEECE6] space-y-6"
        >
          <div className="text-xs text-[#A0A0B0] border-b border-[#EEECE6] pb-3">
            Last updated: September 4, 2026
          </div>

          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <Scale size={16} className="text-[#FFBE91]" />
              1. Acceptance of Terms
            </h2>
            <p className="text-xs text-[#4A4A5A] pl-6">
              By using MarketFlip, you agree to these Terms of Service. If you do not agree, please do not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <CheckCircle size={16} className="text-[#FFBE91]" />
              2. User Responsibilities
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> You are responsible for the accuracy of information you provide</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> You agree not to post false or misleading listings</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> You agree not to engage in fraudulent or deceptive behavior</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> You agree to communicate respectfully with other users</p>
              <p className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500" /> You are responsible for finalizing transactions offline</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-[#FFBE91]" />
              3. Prohibited Activities
            </h2>
            <div className="space-y-1.5 text-xs text-[#4A4A5A] pl-6">
              <p className="flex items-center gap-2"><AlertCircle size={12} className="text-rose-500" /> Posting illegal or prohibited items</p>
              <p className="flex items-center gap-2"><AlertCircle size={12} className="text-rose-500" /> Harassment, abuse, or threats to other users</p>
              <p className="flex items-center gap-2"><AlertCircle size={12} className="text-rose-500" /> Spam, phishing, or malicious content</p>
              <p className="flex items-center gap-2"><AlertCircle size={12} className="text-rose-500" /> Manipulating bids or auctions</p>
              <p className="flex items-center gap-2"><AlertCircle size={12} className="text-rose-500" /> Sharing contact information before a transaction is finalized</p>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <AlertCircle size={16} className="text-[#FFBE91]" />
              4. Dispute Resolution
            </h2>
            <p className="text-xs text-[#4A4A5A] pl-6">
              MarketFlip is a marketplace facilitator. We do not process payments or guarantee transactions. 
              Disputes between buyers and shops should be resolved directly. We provide OTP verification and 
              reporting tools to assist with resolution.
            </p>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-[#1A1A2E] flex items-center gap-2 mb-2">
              <Clock size={16} className="text-[#FFBE91]" />
              5. Account Termination
            </h2>
            <p className="text-xs text-[#4A4A5A] pl-6">
              We reserve the right to suspend or terminate accounts that violate these terms, 
              engage in fraudulent activity, or abuse the platform.
            </p>
          </section>

          <div className="border-t border-[#EEECE6] pt-3 text-[10px] text-[#A0A0B0]">
            <p>By using MarketFlip, you agree to these Terms of Service.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsOfService;