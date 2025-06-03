import { useState, useEffect } from "react";

export const useImageLoading = (src?: string) => {
  const [isLoading, setIsLoading] = useState(!!src);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!src) return;

    setIsLoading(true);
    setIsError(false);

    const img = new Image();
    img.src = src;

    img.onload = () => setIsLoading(false);
    img.onerror = () => {
      setIsLoading(false);
      setIsError(true);
    };

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return { isLoading, isError };
};
