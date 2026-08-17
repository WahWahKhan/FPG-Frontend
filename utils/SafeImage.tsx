// utils/SafeImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  useContainMode?: boolean;
}

const SafeImage = ({
  src,
  alt,
  width = 300,
  height = 300,
  className = '',
  useContainMode = false
}: SafeImageProps) => {
  const [isError, setIsError] = useState(false);
  // Try Next's optimizer first; only fall back to the raw file if that specific
  // image errors out (mirrors utils/OptimizedImage.tsx's fallback behaviour).
  const [useUnoptimized, setUseUnoptimized] = useState(false);

  const handleError = () => {
    if (!useUnoptimized) {
      setUseUnoptimized(true);
    } else {
      setIsError(true);
    }
  };

  if (!src || isError) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}
           style={{ width: useContainMode ? '100%' : width, height: useContainMode ? '100%' : height }}>
        <span className="text-gray-400">Image unavailable</span>
      </div>
    );
  }

  if (useContainMode) {
    // For container mode, use next/image with fixed dimensions but responsive classes
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Image
          key={src}
          src={src}
          alt={alt}
          width={1000}
          height={1000}
          className={`max-w-full max-h-full object-contain ${className}`}
          unoptimized={useUnoptimized}
          onError={handleError}
        />
      </div>
    );
  }

  // Standard mode with explicit width/height
  return (
    <Image
      key={src}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      unoptimized={useUnoptimized}
      onError={handleError}
    />
  );
};

export default SafeImage;