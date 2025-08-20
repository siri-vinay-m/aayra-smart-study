import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import UserSupportCard from '@/components/profile/UserSupportCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const HelpPage: React.FC = () => {
  const navigate = useNavigate();



  return (
    <MainLayout>
      <div className="px-4 max-w-md mx-auto">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/profile')}
            className="mr-3"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-semibold">Help & Support</h1>
        </div>

        {/* User Support Card */}
        <UserSupportCard />
      </div>
    </MainLayout>
  );
};

export default HelpPage;