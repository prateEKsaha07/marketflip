import { Star } from 'lucide-react';

const ReviewStars = ({ rating, onRatingChange, readonly = false, size = 24 }) => {
  const handleClick = (index) => {
    if (!readonly && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className="flex gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <button
          key={index}
          type="button"
          onClick={() => handleClick(index)}
          disabled={readonly}
          className={`${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'} focus:outline-none`}
        >
          <Star
            size={size}
            className={`${
              index < rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            } ${!readonly && 'hover:text-yellow-400'} transition-colors`}
          />
        </button>
      ))}
    </div>
  );
};

export default ReviewStars;