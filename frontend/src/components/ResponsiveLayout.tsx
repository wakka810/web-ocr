import React, { ReactNode } from 'react';
import { useIsMobile } from '@/hooks/useMediaQuery';

interface ResponsiveLayoutProps {
  children: ReactNode;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();

  return (
    <div className={`
      min-h-screen bg-gray-50
      ${isMobile ? 'pb-safe' : ''}
    `}>
      {children}
    </div>
  );
};

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      max-w-7xl mx-auto
      px-4 sm:px-6 lg:px-8
      ${className}
    `}>
      {children}
    </div>
  );
};

interface ResponsiveGridProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      grid grid-cols-1 
      lg:grid-cols-2 
      gap-4 sm:gap-6 lg:gap-8
      ${className}
    `}>
      {children}
    </div>
  );
};

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
}

export const ResponsiveCard: React.FC<ResponsiveCardProps> = ({ 
  children, 
  className = '' 
}) => {
  return (
    <div className={`
      bg-white rounded-lg shadow 
      p-4 sm:p-6
      ${className}
    `}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;