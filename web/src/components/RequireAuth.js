import { Navigate, useLocation } from "react-router-dom";
import { getUser, isAuthenticated } from "../utils/auth";

export default function RequireAuth({ children, roles }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0) {
    const user = getUser();
    const role = user?.role;
    if (!role || !roles.includes(role)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}
