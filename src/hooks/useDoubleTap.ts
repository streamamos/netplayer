import { useRef } from 'react';

type TouchEvent = React.TouchEvent<HTMLDivElement>;
type MouseEvent = React.MouseEvent<HTMLDivElement>;
type CombinedEvent = TouchEvent | MouseEvent;

interface Props {
  onDoubleTap: (e: CombinedEvent) => void;
  onTap?: (e: CombinedEvent) => void;
  tapThreshold?: number;
}

const useDoubleTap = ({ onDoubleTap, onTap, tapThreshold = 300 }: Props) => {
  const lastTap = useRef(0);
  const timeout = useRef<NodeJS.Timeout>();
  
  const handleTap = (e: CombinedEvent) => {
    if ('persist' in e) e.persist();
    
    if (timeout.current) {
      clearTimeout(timeout.current);
    }
    const now = new Date().getTime();
    const timeFromLastTap = now - lastTap.current;
    if (timeFromLastTap <= tapThreshold && timeFromLastTap > 0) {
      onDoubleTap?.(e);
    } else {
      timeout.current = setTimeout(() => {
        onTap?.(e);
      }, tapThreshold);
    }
    lastTap.current = new Date().getTime();
  };
  return handleTap;
};

export default useDoubleTap;
