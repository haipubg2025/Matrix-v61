
import React from 'react';

interface NewIndicatorProps {
  className?: string;
}

export const NewIndicator: React.FC<NewIndicatorProps> = ({ className = "" }) => (
  <div className={`w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_#ef4444] animate-pulse shrink-0 ${className}`} title="Thông tin mới" />
);
