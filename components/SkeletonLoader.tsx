import React from 'react';

// Reusable skeleton loader with shimmering animation
const SkeletonLoader: React.FC<{ className?: string }> = ({ className }) => {
  return <div className={`skeleton-loader ${className || ''}`} />;
};

export default SkeletonLoader;
