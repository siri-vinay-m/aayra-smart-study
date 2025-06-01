
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, Zap } from 'lucide-react';
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
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const calculateDaysRemaining = async () => {
      if (authUser && user?.subscriptionPlan === 'free') {
        try {
          const { data, error } = await supabase.rpc('calculate_free_plan_days_remaining', {
            user_created_at: authUser.created_at
          });
          
          if (error) {
            console.error('Error calculating days remaining:', error);
          } else {
            setDaysRemaining(data);
          }
        } catch (error) {
          console.error('Error in calculateDaysRemaining:', error);
        }
      }
    };

    calculateDaysRemaining();
  }, [authUser, user?.subscriptionPlan]);

  const handleUpgradeToPremium = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      
      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderPlanDetails = () => {
    if (user?.subscriptionPlan === 'premium') {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Zap size={16} />
            <span>10 sessions per day</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-600">
            <Crown size={16} />
            <span>No ads</span>
          </div>
          {user.subscriptionPlan === 'premium' && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar size={16} />
              <span>Valid for 30 days</span>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Zap size={16} />
            <span>
              {daysRemaining !== null && daysRemaining > 0 
                ? '2 sessions per day' 
                : '2 sessions per week'}
            </span>
          </div>
          {daysRemaining !== null && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Calendar size={16} />
              <span>
                {daysRemaining > 0 
                  ? `${daysRemaining} days remaining in trial period`
                  : 'Trial period ended - weekly limits apply'}
              </span>
            </div>
          )}
        </div>
      );
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Crown size={20} className={user?.subscriptionPlan === 'premium' ? 'text-yellow-500' : 'text-gray-400'} />
          Subscription Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Current Plan:</span>
          <span className={`font-medium capitalize ${
            user?.subscriptionPlan === 'premium' ? 'text-yellow-600' : 'text-gray-900'
          }`}>
            {user?.subscriptionPlan || 'Free'}
            {user?.subscriptionPlan === 'free' && daysRemaining !== null && daysRemaining > 0 && (
              <span className="text-xs text-orange-500 ml-1">
                ({daysRemaining} days left)
              </span>
            )}
          </span>
        </div>
        
        {renderPlanDetails()}
        
        {user?.subscriptionPlan === 'free' && (
          <Button 
            onClick={handleUpgradeToPremium}
            disabled={isLoading}
            variant="outline" 
            className="w-full border-orange-500 text-orange-500 hover:bg-orange-50"
          >
            {isLoading ? 'Processing...' : 'Upgrade to Premium'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatusCard;
