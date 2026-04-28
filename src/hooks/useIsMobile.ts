import { useWindowSize } from 'react-use';

/**
 * useIsMobile
 * Returns true when the viewport width is below 768px (Tailwind's `md` breakpoint).
 * Uses react-use's useWindowSize for accurate, live screen size detection.
 */
export const useIsMobile = (): boolean => {
  const { width } = useWindowSize();
  return width < 768;
};
