import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 1024;

const checkIsMobile = () => {
  if (typeof window === 'undefined') return false;
  
  // 1. Width check
  const isSmallWidth = window.innerWidth <= MOBILE_BREAKPOINT;
  
  // 2. User Agent check (fallback for tablets/phones in landscape > 1024px)
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // 3. Touch support check (good indicator for mobile/tablet)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  return isSmallWidth || isMobileUA || hasTouch;
};

const useCheckMobile = () => {
  const [isMobile, setIsMobile] = useState(checkIsMobile());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsMobile(checkIsMobile());
    };

    window.addEventListener('resize', handleResize);
    // Initial check
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

export default useCheckMobile;
