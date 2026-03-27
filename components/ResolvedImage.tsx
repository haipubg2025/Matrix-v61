
import React, { useState, useEffect } from 'react';
import { dbService } from '../services/dbService';

interface ResolvedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallback?: string;
}

/**
 * A wrapper around <img> that automatically resolves local image IDs 
 * (e.g., local_img_...) into Base64 data URLs using dbService.
 */
export const ResolvedImage: React.FC<ResolvedImageProps> = ({ 
  src, 
  fallback, 
  alt = "", 
  className = "", 
  onError,
  ...props 
}) => {
  const [resolvedSrc, setResolvedSrc] = useState<string>(src);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const resolve = async () => {
      if (!src) {
        setResolvedSrc(fallback || "");
        return;
      }

      // If it's already a URL or base64, just use it
      if (src.startsWith('http') || src.startsWith('data:')) {
        setResolvedSrc(src);
        return;
      }

      // If it's a local ID, resolve it
      setIsLoading(true);
      try {
        const loaded = await dbService.loadImage(src);
        if (isMounted) {
          if (loaded) {
            setResolvedSrc(loaded);
            setError(false);
          } else {
            setResolvedSrc(fallback || "");
            setError(true);
          }
        }
      } catch (err) {
        console.error("Failed to resolve image:", src, err);
        if (isMounted) {
          setError(true);
          if (fallback) setResolvedSrc(fallback);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    resolve();

    return () => {
      isMounted = false;
    };
  }, [src, fallback]);

  const handleLocalError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setError(true);
    if (fallback) setResolvedSrc(fallback);
    if (onError) onError(e);
  };

  if (!resolvedSrc && isLoading) {
    return <div className={`animate-pulse bg-neutral-800 ${className}`} />;
  }

  return (
    <img 
      src={resolvedSrc} 
      alt={alt} 
      className={className} 
      onError={handleLocalError}
      referrerPolicy="no-referrer"
      {...props} 
    />
  );
};
