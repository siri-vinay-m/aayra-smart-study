import React from 'react';
import { Navigate } from 'react-router-dom';
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "@/components/LandingPage";

/**
 * RootRedirect now serves the public LandingPage for unauthenticated visitors.
 * - If authenticated: redirect to /home
 * - If unauthenticated: render LandingPage (high-converting sales page)
 */
const RootRedirect = () => {
  const { isAuthenticated } = useUser();
  const { loading, session } = useAuth();

  console.log('RootRedirect: loading =', loading, 'isAuthenticated =', isAuthenticated, 'session =', !!session);

  // Show loading while authentication state is being determined
  if (loading) {
    console.log('RootRedirect: Showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If we have a session, user is authenticated - redirect to home
  if (session || isAuthenticated) {
    console.log('RootRedirect: User authenticated, redirecting to /home');
    return <Navigate to="/home" replace />;
  }
  
  // Otherwise, show the public landing page
  console.log('RootRedirect: User not authenticated, rendering LandingPage');
  return <LandingPage />;
};

export default RootRedirect;
