import React from 'react';
import { CompassIcon } from '../constants';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-center items-center">
      <div className="relative h-16 w-16">
        <CompassIcon className="h-16 w-16 gradient-text animate-pulse" />
        <div className="absolute inset-0 rounded-full border-2 border-orange-500/50 animate-ping"></div>
      </div>
    </div>
  );
};

export default LoadingIndicator;