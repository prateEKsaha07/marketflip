import { Star } from 'lucide-react';

const ReviewBadge = ({ averageRating, totalReviews, size = 'sm' }) => {
  if (!averageRating || totalReviews === 0) {
    return (
      <span className="text-xs text-gray-400">
        No reviews yet
      </span>
    );
  }

  const sizeClasses = {
    sm: 'text-xs gap-0.5',
    md: 'text-sm gap-1',
    lg: 'text-base gap-1.5'
  };

  const starSizes = {
    sm: 14,
    md: 18,
    lg: 22
  };

  return (
    <div className={`flex items-center ${sizeClasses[size]}`}>
      <div className="flex items-center">
        <Star size={starSizes[size]} className="fill-yellow-400 text-yellow-400" />
        <span className="font-semibold text-gray-700 ml-1">
          {averageRating.toFixed(1)}
        </span>
      </div>
      <span className="text-gray-400 ml-1">
        ({totalReviews} {totalReviews === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
};

export default ReviewBadge;