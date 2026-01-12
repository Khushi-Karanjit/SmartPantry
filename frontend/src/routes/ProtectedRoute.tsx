import { Navigate } from "react-router-dom";
import { isAuthed } from "../auth/auth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
