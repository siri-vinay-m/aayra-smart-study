
import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useSession } from '@/contexts/SessionContext';
import { format } from 'date-fns';
import { AlertCircle } from 'lucide-react';

const IncompleteSessionsPage = () => {
  const { incompleteSessions, setCurrentSession } = useSession();
  const navigate = useNavigate();
  
  const handleSessionClick = (session: any) => {
    console.log('Resuming incomplete session:', session.id, 'Status:', session.status);
    
    // Set current session and navigate to validation page to resume
    setCurrentSession(session);
    navigate('/validation');
  };

  const getStatusDisplay = (status: string) => {
    if (status === 'validating') {
      return 'Start Date';
    }
    return 'Incomplete';
  };

  const getStatusColor = (status: string) => {
    if (status === 'validating') {
      return 'text-gray-600';
    }
    return 'text-orange-500';
  };
  
  return (
    <MainLayout>
      <div className="px-4">
        <h1 className="text-2xl font-semibold mb-6">Incomplete Sessions</h1>
        
        {incompleteSessions.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle size={48} className="text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No incomplete sessions</p>
            <p className="text-sm text-gray-500 mt-2">
              All your sessions have been completed successfully!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {incompleteSessions.map((session) => (
              <div 
                key={session.id}
                className="bg-white shadow-sm rounded-lg p-4 border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSessionClick(session)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-900">{session.sessionName}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Subject: {session.subjectName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Topic: {session.topicName}
                    </p>
                    <p className="text-sm text-gray-500">
                      Started: {format(new Date(session.createdAt), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div className={`flex items-center ${getStatusColor(session.status)}`}>
                    <AlertCircle size={20} className="mr-1" />
                    <span className="text-sm font-medium">{getStatusDisplay(session.status)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default IncompleteSessionsPage;
