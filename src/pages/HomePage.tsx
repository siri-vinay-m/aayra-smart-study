
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import FeatureBlock from '@/components/ui/feature-block';
import { useSession } from '@/contexts/SessionContext';
import { Clock, Plus, List } from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const { pendingReviews, completedSessions } = useSession();
  
  return (
    <MainLayout>
      <div className="px-4">
        <div className="text-center mb-2">
          <h1 className="text-2xl font-semibold text-orange-500">AAYRA</h1>
          <p className="text-lg text-gray-600">The Smarter way to Master more.</p>
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
          description="Begin a focused study session"
          icon={<Plus size={24} />}
          onClick={() => navigate('/new-session')}
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
