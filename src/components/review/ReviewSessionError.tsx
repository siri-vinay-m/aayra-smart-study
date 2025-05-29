
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';

interface ReviewSessionErrorProps {
  message: string;
  showRetry?: boolean;
}

const ReviewSessionError: React.FC<ReviewSessionErrorProps> = ({ 
  message, 
  showRetry = false 
}) => {
  const navigate = useNavigate();

  return (
    <MainLayout>
      <div className="px-4 text-center py-8">
        <p className="text-lg text-gray-600 mb-4">{message}</p>
        <button 
          onClick={() => navigate('/home')}
          className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
        >
          Go to Home
        </button>
      </div>
    </MainLayout>
  );
};

export default ReviewSessionError;
