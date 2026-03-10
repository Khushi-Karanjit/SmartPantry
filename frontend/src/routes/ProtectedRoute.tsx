import { Navigate } from "react-router-dom";
import { getUser, isAuthed } from "../auth/auth";

type Role = "user" | "admin";

export default function ProtectedRoute({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: Role;
}) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  if (requiredRole) {
    const user = getUser();
    if (!user || user.role !== requiredRole) return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}
