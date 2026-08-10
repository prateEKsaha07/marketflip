import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AnimatedBackground from '../components/backgrounds/AnimatedBackground';
import LandingNavbar from '../components/LandingNavbar';
import Hero from '../components/sections/Hero';
import BentoFeatures from '../components/sections/BentoFeatures';
import HowItWorks from '../components/sections/HowItWorks';
import AnimatedTestimonials from '../components/sections/AnimatedTestimonials';
import FAQ from '../components/sections/FAQ';
import AboutDev from '../components/sections/AboutDev';
import Footer from '../components/sections/Footer';

const Landing = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      if (user?.role === 'buyer') {
        navigate('/buyer/dashboard');
      } else if (user?.role === 'shop_owner') {
        navigate('/shop/dashboard');
      }
    }
  }, [loading, isAuthenticated, user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FFFCE1]">
        <div className="animate-pulse text-2xl font-bold text-[#FFBE91]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#FFFCE1] overflow-hidden">
      <AnimatedBackground />
      <LandingNavbar />
      <Hero />
      <BentoFeatures />
      <HowItWorks />
      <AnimatedTestimonials />
      <FAQ />
      <AboutDev />
      <Footer />
    </div>
  );
};

export default Landing;