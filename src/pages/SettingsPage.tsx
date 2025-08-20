import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MainLayout from '@/components/layout/MainLayout';
import SubscriptionStatusCard from '@/components/profile/SubscriptionStatusCard';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useUser } from '@/contexts/UserContext';

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useUser();

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
          <h1 className="text-2xl font-semibold">Settings</h1>
        </div>

        {/* Subscription Status */}
        <SubscriptionStatusCard user={user} />

        {/* Appearance Settings */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Theme</h3>
                <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>



        {/* Additional Settings Sections */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/settings/notifications')}
            >
              Manage Notifications
            </Button>
          </CardContent>
        </Card>


      </div>
    </MainLayout>
  );
};

export default SettingsPage;