
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
import { Heart, Folder, FolderOpen, ArrowLeft } from 'lucide-react';

const CompletedSessionsPage = () => {
  const { completedSessions, toggleFavorite } = useSession();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Group sessions by subject name
  const sessionsBySubject = completedSessions.reduce((acc, session) => {
    const subject = session.subjectName;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(session);
    return acc;
  }, {} as Record<string, typeof completedSessions>);

  // Sort sessions within each subject from newest to oldest
  Object.keys(sessionsBySubject).forEach(subject => {
    sessionsBySubject[subject].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const subjects = Object.keys(sessionsBySubject).sort();
  
  const handleToggleFavorite = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(sessionId);
  };
  
  const handleSessionClick = (sessionId: string) => {
    navigate(`/review/${sessionId}`);
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        {selectedSubject ? (
          // Show sessions for selected subject
          <>
            <div className="flex items-center mb-6">
              <button
                onClick={handleBackToSubjects}
                className="flex items-center text-blue-600 hover:text-blue-800 mr-4"
              >
                <ArrowLeft size={20} className="mr-2" />
                Back to Subjects
              </button>
              <h1 className="text-2xl font-semibold">{selectedSubject} Sessions</h1>
            </div>
            
            <div className="space-y-4">
              {sessionsBySubject[selectedSubject].map((session) => (
                <div 
                  key={session.id}
                  className="bg-card shadow-sm rounded-lg p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSessionClick(session.id)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-foreground">{session.sessionName}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Topic: {session.topicName}
            </p>
            <p className="text-sm text-muted-foreground">
                        {format(new Date(session.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleToggleFavorite(session.id, e)}
                      className="p-2 hover:bg-accent rounded-full"
                    >
                      <Heart 
                        size={20} 
                        className={session.isFavorite ? 'text-red-500 fill-red-500' : 'text-muted-foreground'} 
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Show subject folders
          <>
            <h1 className="text-2xl font-semibold mb-6">Completed Sessions</h1>
            
            {subjects.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No completed sessions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div 
                    key={subject}
                    className="bg-card shadow-sm rounded-lg p-4 border border-border cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <div className="flex items-center">
                      <Folder size={24} className="text-blue-500 mr-3" />
                      <div>
                        <h3 className="font-medium text-foreground">{subject}</h3>
            <p className="text-sm text-muted-foreground">
                          {sessionsBySubject[subject].length} session{sessionsBySubject[subject].length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default CompletedSessionsPage;
