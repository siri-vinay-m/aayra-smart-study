import { Navigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

const RootRedirect = () => {
  const { isAuthenticated } = useUser();

  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default RootRedirect;
