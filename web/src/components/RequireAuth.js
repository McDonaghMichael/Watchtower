import { Navigate, useLocation } from "react-router-dom";
import { getUser, isAuthenticated } from "../utils/auth";

export default function RequireAuth({ children, roles, perms }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const user = getUser();

  if (roles && roles.length > 0) {
    const role = user?.role;
    if (!role || !roles.includes(role)) {
      return <Navigate to="/login" replace />;
    }
  }

  if (perms && perms.length > 0) {
    const userPerms = user?.role_permissions || [];
    const has = perms.some((p) => userPerms.includes(p));
    if (!has) return <Navigate to="/login" replace />;
  }

  return children;
}
