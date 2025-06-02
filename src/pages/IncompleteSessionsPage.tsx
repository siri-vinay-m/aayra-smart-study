
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
import { AlertCircle, Folder, ArrowLeft } from 'lucide-react';

const IncompleteSessionsPage = () => {
  const { incompleteSessions, setCurrentSession } = useSession();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  
  // Group sessions by subject name
  const sessionsBySubject = incompleteSessions.reduce((acc, session) => {
    const subject = session.subjectName;
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(session);
    return acc;
  }, {} as Record<string, typeof incompleteSessions>);

  // Sort sessions within each subject from newest to oldest
  Object.keys(sessionsBySubject).forEach(subject => {
    sessionsBySubject[subject].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  const subjects = Object.keys(sessionsBySubject).sort();
  
  const handleSessionClick = (session: any) => {
    console.log('Resuming incomplete session:', session.id, 'Status:', session.status);
    
    // Set current session and navigate to review page to start AI content generation
    setCurrentSession(session);
    navigate(`/review/${session.id}`);
  };

  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
  };

  const handleBackToSubjects = () => {
    setSelectedSubject(null);
  };

  const getStatusDisplay = (session: any) => {
    // Show the actual start date formatted
    return format(new Date(session.createdAt), 'MMM d, yyyy');
  };

  const getStatusColor = () => {
    // Always use blue color for the start date
    return 'text-blue-600';
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
                  className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSessionClick(session)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{session.sessionName}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Topic: {session.topicName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {getStatusDisplay(session)}
                      </p>
                    </div>
                    <div className={`flex items-center ${getStatusColor()}`}>
                      <AlertCircle size={20} className="mr-1" />
                      <span className="text-sm font-medium">Incomplete</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Show subject folders
          <>
            <h1 className="text-2xl font-semibold mb-6">Incomplete Sessions</h1>
            
            {subjects.length === 0 ? (
              <div className="text-center py-8">
                <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No incomplete sessions</p>
                <p className="text-sm text-gray-500 mt-2">
                  All your sessions have been completed successfully!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {subjects.map((subject) => (
                  <div 
                    key={subject}
                    className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleSubjectClick(subject)}
                  >
                    <div className="flex items-center">
                      <Folder size={24} className="text-orange-500 mr-3" />
                      <div>
                        <h3 className="font-medium text-gray-900">{subject}</h3>
                        <p className="text-sm text-gray-500">
                          {sessionsBySubject[subject].length} incomplete session{sessionsBySubject[subject].length !== 1 ? 's' : ''}
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

export default IncompleteSessionsPage;
