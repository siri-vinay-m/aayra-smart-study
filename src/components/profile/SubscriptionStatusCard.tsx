
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown } from 'lucide-react';
import { User } from '@/contexts/UserContext';

interface SubscriptionStatusCardProps {
  user: User | null;
}

const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({ user }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown size={20} className={user?.subscriptionPlan === 'premium' ? 'text-yellow-500' : 'text-gray-400'} />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Current Plan:</span>
          <span className={`font-medium capitalize ${
            user?.subscriptionPlan === 'premium' ? 'text-yellow-600' : 'text-gray-900'
          }`}>
            {user?.subscriptionPlan || 'Free'}
          </span>
        </div>
        {user?.subscriptionPlan === 'free' && (
          <Button 
            variant="outline" 
            className="w-full mt-3 border-orange-500 text-orange-500 hover:bg-orange-50"
          >
            Upgrade to Premium
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;
