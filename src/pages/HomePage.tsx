
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import FeatureBlock from '@/components/ui/feature-block';
import { useSession } from '@/contexts/SessionContext';
import { useSessionLimits } from '@/hooks/useSessionLimits';
import { Clock, Plus, List, AlertCircle } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { pendingReviews, completedSessions, incompleteSessions } = useSession();
  const sessionLimits = useSessionLimits();
  
  const getNewSessionDescription = () => {
    if (sessionLimits.isLoading) {
      return "Loading session limits...";
    }
    
    if (!sessionLimits.canCreateSession) {
      return "Session limit reached for today/week";
    }
    
    let description = "Begin a focused study session";
    if (sessionLimits.dailyLimit) {
      description += ` (${sessionLimits.sessionsUsedToday}/${sessionLimits.dailyLimit} today)`;
    }
    
    return description;
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-semibold text-orange-500">AAYRA</h1>
          <p className="text-lg text-muted-foreground">The Smarter way to Master more.</p>
        </div>
        
        <FeatureBlock
          title="Pending Reviews"
          description="Review your past study sessions"
          icon={<Clock size={24} />}
          count={pendingReviews.length}
          onClick={() => navigate('/pending-reviews')}
        />
        
        <FeatureBlock
          title="Start New Session"
          description={getNewSessionDescription()}
          icon={<Plus size={24} />}
          onClick={() => navigate('/new-session')}
          disabled={!sessionLimits.canCreateSession}
          className={!sessionLimits.canCreateSession ? 'opacity-50' : ''}
        />
        
        <FeatureBlock
          title="Incomplete Sessions"
          description="Continue your unfinished sessions"
          icon={<AlertCircle size={24} />}
          count={incompleteSessions.length}
          onClick={() => navigate('/incomplete-sessions')}
        />
        
        <FeatureBlock
          title="Completed Sessions"
          description="View your past study sessions"
          icon={<List size={24} />}
          count={completedSessions.length}
          onClick={() => navigate('/completed-sessions')}
        />
      </div>
    </MainLayout>
  );
};

export default HomePage;
