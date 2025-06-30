import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUser } from '@/contexts/UserContext';

/**
 * Debug page to help identify authentication and user context issues
 */
const DebugPage = () => {
  const { user: authUser, session, loading: authLoading } = useAuth();
  const { user, isAuthenticated } = useUser();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Information</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Auth Context</h2>
          <p><strong>Loading:</strong> {authLoading ? 'true' : 'false'}</p>
          <p><strong>Auth User ID:</strong> {authUser?.id || 'null'}</p>
          <p><strong>Auth User Email:</strong> {authUser?.email || 'null'}</p>
          <p><strong>Session:</strong> {session ? 'exists' : 'null'}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">User Context</h2>
          <p><strong>Is Authenticated:</strong> {isAuthenticated ? 'true' : 'false'}</p>
          <p><strong>User ID:</strong> {user?.id || 'null'}</p>
          <p><strong>User Email:</strong> {user?.email || 'null'}</p>
          <p><strong>Display Name:</strong> {user?.displayName || 'null'}</p>
        </div>
        
        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Navigation Test</h2>
          <p>If you can see this page, React routing is working correctly.</p>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;