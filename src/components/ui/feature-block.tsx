
import React from 'react';
import { cn } from '@/lib/utils';

interface FeatureBlockProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  count?: number;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const FeatureBlock: React.FC<FeatureBlockProps> = ({
  title,
  description,
  icon,
  count,
  onClick,
  disabled = false,
  className
}) => {
  return (
    <div
      className={cn(
        "bg-white shadow-sm rounded-lg p-4 border border-gray-200 mb-4 transition-all",
        onClick && !disabled ? "cursor-pointer hover:shadow-md hover:border-orange-300" : "",
        disabled ? "cursor-not-allowed" : "",
        className
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className={cn(
              "text-orange-500",
              disabled ? "text-gray-400" : ""
            )}>
              {icon}
            </div>
          )}
          <div>
            <h3 className={cn(
              "font-medium text-gray-900",
              disabled ? "text-gray-500" : ""
            )}>
              {title}
            </h3>
            <p className={cn(
              "text-sm text-gray-500 mt-1",
              disabled ? "text-gray-400" : ""
            )}>
              {description}
            </p>
          </div>
        </div>
        {count !== undefined && (
          <span className={cn(
            "bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-sm font-medium",
            disabled ? "bg-gray-100 text-gray-400" : ""
          )}>
            {count}
          </span>
        )}
      </div>
    </div>
  );
};

export default FeatureBlock;
