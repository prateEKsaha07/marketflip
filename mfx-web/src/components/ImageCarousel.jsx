import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ImageCarousel = ({ images, alt = 'Product image' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!images || images.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const openFullscreen = () => {
    setIsFullscreen(true);
  };

  const closeFullscreen = () => {
    setIsFullscreen(false);
  };

  return (
    <>
      {/* Main Image - Click to enlarge */}
      <div className="relative w-full h-64 md:h-80 lg:h-96 bg-[#F8F6F0] rounded-xl overflow-hidden border border-[#EEECE6] group">
        <img
          src={images[currentIndex]}
          alt={`${alt} ${currentIndex + 1}`}
          className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500"
          onClick={openFullscreen}
        />

        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-3 py-1 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          </>
        )}
      </div>

      {/* Fullscreen - Only Image, No Details */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          >
            <X size={32} />
          </button>
          
          <img
            src={images[currentIndex]}
            alt={`${alt} ${currentIndex + 1}`}
            className="max-w-[95vw] max-h-[95vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all"
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); goToNext(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-3 transition-all"
              >
                <ChevronRight size={32} />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-4 py-1.5 rounded-full">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default ImageCarousel;