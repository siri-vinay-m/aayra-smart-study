
import React from 'react';
import MainLayout from '@/components/layout/MainLayout';

const ReviewSessionLoading = () => {
  return (
    <MainLayout>
      <div className="px-4 text-center py-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-lg text-gray-600">
            Preparing your review content...
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default ReviewSessionLoading;
