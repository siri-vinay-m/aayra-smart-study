import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";

const RootRedirect = () => {
  const { isAuthenticated } = useUser();
  const { loading } = useAuth();

  // Show loading while authentication state is being determined
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default RootRedirect;
