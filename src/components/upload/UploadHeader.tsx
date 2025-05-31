
import React from 'react';

interface UploadHeaderProps {
  sessionName: string;
}

const UploadHeader: React.FC<UploadHeaderProps> = ({ sessionName }) => {
  return (
    <div className="text-center mb-6">
      <h1 className="text-xl font-semibold mb-2">{sessionName}</h1>
      <p className="text-gray-600">Upload your study materials to generate AI content</p>
    </div>
  );
};

export default UploadHeader;
