
import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface FeatureBlockProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  onClick?: () => void;
  count?: number;
  className?: string;
}

const FeatureBlock: React.FC<FeatureBlockProps> = ({
  title,
  description,
  icon,
  onClick,
  count,
  className
}) => {
  return (
    <div 
      className={cn("feature-block", className)}
      onClick={onClick}
    >
      <div className="flex items-start">
        {icon && (
          <div className="text-primary mr-4 mt-1">
            {icon}
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            {count !== undefined && (
              <div className="bg-primary text-white px-2 py-1 rounded-full text-sm font-medium">
                {count}
              </div>
            )}
          </div>
          
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeatureBlock;
