'use client';

import { useRef, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimateOnScrollProps {
  children: React.ReactNode;
  className?: string;
  animationClasses?: string;
  hiddenClasses?: string;
}

export default function AnimateOnScroll({
  children,
  className,
  animationClasses = 'animate-in fade-in duration-1000',
  hiddenClasses = 'opacity-0',
}: AnimateOnScrollProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Set visibility based on whether the element is intersecting the viewport.
        // This will trigger the animation every time it enters the screen.
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Trigger when 10% of the element is visible
      }
    );

    observer.observe(element);

    // Cleanup the observer when the component unmounts
    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  return (
    <div ref={ref} className={cn(className, isVisible ? animationClasses : hiddenClasses)}>
      {children}
    </div>
  );
}
