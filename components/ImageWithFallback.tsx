import React, { useState, useEffect } from 'react';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  alt: string;
}

const GenericPlaceholder: React.FC<{ text: string, className?: string }> = ({ text, className }) => (
    <div className={`${className || ''} bg-slate-800 flex flex-col items-center justify-center text-center p-4`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-1/4 w-1/4 text-slate-600 mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span className="text-slate-500 font-semibold break-words">{text}</span>
    </div>
);

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({ src, fallbackSrc, alt, ...props }) => {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [src]);

  const handleError = () => {
    setError(true);
  };

  if (error || !src) {
    return <GenericPlaceholder text={alt} className={props.className} />;
  }

  return <img src={src} alt={alt} onError={handleError} {...props} />;
};

export default ImageWithFallback;