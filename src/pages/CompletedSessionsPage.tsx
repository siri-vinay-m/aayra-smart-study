
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
import { Heart } from 'lucide-react';

const CompletedSessionsPage = () => {
  const { completedSessions, setCompletedSessions } = useSession();
  const navigate = useNavigate();
  
  const handleToggleFavorite = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setCompletedSessions(completedSessions.map(session => {
      if (session.id === sessionId) {
        return { ...session, isFavorite: !session.isFavorite };
      }
      return session;
    }));
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6">Completed Sessions</h1>
        
        {completedSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No completed sessions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedSessions.map((session) => (
              <div 
                key={session.id}
                className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/session/${session.id}`)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{session.sessionName}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(session.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(session.id, e)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Heart 
                      size={20} 
                      className={session.isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'} 
                    />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default CompletedSessionsPage;
