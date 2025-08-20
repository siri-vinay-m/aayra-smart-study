
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, session } = useAuth();
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);

  React.useEffect(() => {
    if (!loading) {
      setHasCheckedAuth(true);
    }
  }, [loading]);

  if (loading || !hasCheckedAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Check for session first, then user - this prevents redirect issues on mobile
  if (!session && !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
