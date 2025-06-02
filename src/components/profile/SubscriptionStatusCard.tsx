
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, Zap, Clock, Shield } from 'lucide-react';
import { User } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionStatusCardProps {
  user: User | null;
}

const SubscriptionStatusCard: React.FC<SubscriptionStatusCardProps> = ({ user }) => {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgradeToPremium = async () => {
    if (!authUser) {
      toast({
        title: "Authentication Required",
        description: "Please log in to upgrade your subscription.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting checkout process...');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      console.log('Checkout response:', { data, error });
      
      if (error) {
        console.error('Checkout error:', error);
        throw new Error(error.message || 'Failed to create checkout session');
      }
      
      if (data?.url) {
        console.log('Redirecting to checkout:', data.url);
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout Error",
        description: error.message || "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = () => {
    switch (user?.subscriptionPlan) {
      case 'premium':
        return <Crown size={20} className="text-yellow-500" />;
      case 'free':
        return <Clock size={20} className="text-blue-500" />;
      case 'free-for-life':
        return <Shield size={20} className="text-green-500" />;
      default:
        return <Crown size={20} className="text-gray-400" />;
    }
  };

  const getPlanDisplayName = () => {
    switch (user?.subscriptionPlan) {
      case 'premium':
        return 'Premium';
      case 'free':
        return user?.isTrial ? 'Free Trial' : 'Free';
      case 'free-for-life':
        return 'Free for Life';
      default:
        return 'Free';
    }
  };

  const renderPlanDetails = () => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Sessions per day:</div>
            <div className="font-medium">
              {user?.sessionsPerDay || 'Unlimited'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Sessions per week:</div>
            <div className="font-medium">
              {user?.sessionsPerWeek || 'Unlimited'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Ads:</div>
            <div className="font-medium">
              {user?.adsEnabled ? 'Enabled' : 'Disabled'}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Status:</div>
            <div className={`font-medium capitalize ${
              user?.subscriptionStatus === 'active' ? 'text-green-600' : 'text-gray-600'
            }`}>
              {user?.subscriptionStatus || 'Unknown'}
            </div>
          </div>
        </div>

        {user?.subscriptionDaysRemaining !== null && user?.subscriptionDaysRemaining !== undefined && user?.subscriptionPlan !== 'premium' && user?.subscriptionPlan !== 'free-for-life' && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
            <Calendar size={16} />
            <span>
              Trial days remaining: {user.subscriptionDaysRemaining} days
            </span>
          </div>
        )}

        {user?.subscriptionPlan !== 'premium' && user?.subscriptionPlan !== 'free-for-life' && (
          <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
            After the current plan you will have 2 sessions per week
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          {getPlanIcon()}
          Subscription Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Current Plan:</span>
          <span className={`font-medium ${
            user?.subscriptionPlan === 'premium' ? 'text-yellow-600' : 
            user?.subscriptionPlan === 'free-for-life' ? 'text-green-600' : 'text-gray-900'
          }`}>
            {getPlanDisplayName()}
          </span>
        </div>
        
        {renderPlanDetails()}
        
        {user?.subscriptionPlan !== 'premium' && (
          <Button 
            onClick={handleUpgradeToPremium}
            disabled={isLoading}
            variant="outline" 
            className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
          >
            {isLoading ? 'Processing...' : `Upgrade to Premium ${user?.premiumPrice ? `($${user.premiumPrice}/month)` : ''}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;
