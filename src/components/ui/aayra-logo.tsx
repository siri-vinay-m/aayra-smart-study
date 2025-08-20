import React from 'react';

interface AayraLogoProps {
  className?: string;
  size?: number;
}

/**
 * AAYRA Logo component - Uses the provided aayraLarge.png file
 */
const AayraLogo: React.FC<AayraLogoProps> = ({ className = '', size = 24 }) => {
  return (
    <img
      src="/aayraLarge.png"
      alt="AAYRA Logo"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default AayraLogo;