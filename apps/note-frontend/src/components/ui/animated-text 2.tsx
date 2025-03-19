import React from 'react';
import { cn } from '@/utils/utils';

interface AnimatedTextProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string;
}

export const AnimatedText = React.forwardRef<HTMLDivElement, AnimatedTextProps>(
  ({ text, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('animate-text-slide', className)}
        {...props}
      >
        {text}
      </div>
    );
  }
);
