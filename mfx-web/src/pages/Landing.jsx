import React, { useEffect, useState } from 'react';
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
import LoadingAnimation from '../components/ui/LoadingAnimation';
import { X } from 'lucide-react';

const Landing = () => {
  const { isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showNotice, setShowNotice] = useState(true);

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
    return <LoadingAnimation message="Loading your experience..." />;
  }

  return (
    <div className="relative min-h-screen bg-[#FFFCE1] overflow-hidden">
      <AnimatedBackground />
      <LandingNavbar />

      {showNotice && (
        <div className="relative z-20 mx-auto mt-24 max-w-5xl px-4 sm:px-6">
          <div className="relative rounded-xl border border-amber-300 bg-amber-50/90 backdrop-blur-sm shadow-sm p-4 sm:p-5">
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              aria-label="Dismiss notice"
              className="absolute top-3 right-3 rounded-md p-1 text-amber-700 hover:bg-amber-100 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 pr-8">
              <span className="mt-0.5 inline-flex shrink-0 items-center rounded-md bg-amber-200 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
                Notice
              </span>
              <div className="text-sm text-amber-900 leading-relaxed">
                <p className="font-semibold">
                  Project development is on hold.
                </p>
                <p className="mt-1">
                  The free tier of Supabase allows only two projects at once, and I
                  had to pause this one to use the slot for a newer project (which is
                  essentially an upgraded version of this one). I can't afford Supabase
                  Premium right now, so logins are disabled until I sort out an
                  alternative auth/data service. Feel free to browse the landing page,
                  inspect the deployed UI, or explore the codebase and docs on GitHub:{' '}
                  <a
                    href="https://github.com/prateEKsaha07/marketflip"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-2 hover:text-amber-950"
                  >
                    github.com/prateEKsaha07/marketflip
                  </a>
                  . Thanks for your patience.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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