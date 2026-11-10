// utils/OptimizedImage.tsx
import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  useContainMode?: boolean;
  priority?: boolean;
  blurDataURL?: string; // tiny preview shown blurred while loading
}

const OptimizedImage = ({ 
  src, 
  alt, 
  width = 300, 
  height = 300, 
  className = '',
  useContainMode = false,
  priority = false,
  blurDataURL
}: OptimizedImageProps) => {
  const [isError, setIsError] = useState(false);
  const [useUnoptimized, setUseUnoptimized] = useState(false);
  const [imgKey, setImgKey] = useState(0);
  
  if (!src || isError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`} 
        style={{ width: '100%', height: '100%', minHeight: '200px' }}
      >
        <div className="text-center">
          <span className="text-gray-400 text-sm block">Loading Image</span>
          <button 
            onClick={() => {
              setIsError(false);
              setUseUnoptimized(false);
              setImgKey(prev => prev + 1);
            }}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  const handleImageError = () => {
    if (!useUnoptimized) {
      console.warn(`Optimized image failed, trying unoptimized: ${src}`);
      setUseUnoptimized(true);
    } else {
      console.error(`Image failed to load: ${src}`);
      setIsError(true);
    }
  };
  
  // Contain mode: fill the (relatively-positioned) parent box and letterbox the
  // photo inside it. Without this, tall/wide photos render at their natural
  // aspect ratio (height:auto), spill out of the square tile and overlap the text.
  if (useContainMode) {
    return (
      <Image
        key={imgKey}
        src={src}
        alt={alt}
        fill
        // Product/category tiles: 1 col on phones, 2 on sm, 3-4 (~280px each) from lg up.
        sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 300px"
        style={{ objectFit: 'contain' }}
        className={className}
        onError={handleImageError}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        placeholder={blurDataURL ? 'blur' : 'empty'}
        blurDataURL={blurDataURL}
        quality={75}
        unoptimized={useUnoptimized}
      />
    );
  }

  return (
    <Image
      key={imgKey}
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleImageError}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      placeholder={blurDataURL ? 'blur' : 'empty'}
      blurDataURL={blurDataURL}
      quality={75}
      unoptimized={useUnoptimized}
    />
  );
};

export default OptimizedImage;