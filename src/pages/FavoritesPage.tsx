
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
import { Heart } from 'lucide-react';

const FavoritesPage = () => {
  const { completedSessions, toggleFavorite } = useSession();
  const navigate = useNavigate();
  
  const favoritesSessions = completedSessions.filter(session => session.isFavorite);
  
  const handleToggleFavorite = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(sessionId);
  };
  
  const handleSessionClick = (sessionId: string) => {
    navigate(`/review/${sessionId}`);
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6">Favorite Sessions</h1>
        
        {favoritesSessions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No favorite sessions yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {favoritesSessions.map((session) => (
              <div 
                key={session.id}
                className="bg-card shadow-sm rounded-lg p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSessionClick(session.id)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-foreground">{session.sessionName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(session.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleToggleFavorite(session.id, e)}
                    className="p-2 hover:bg-muted rounded-full"
                  >
                    <Heart 
                      size={20} 
                      className="text-red-500 fill-red-500" 
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

export default FavoritesPage;
