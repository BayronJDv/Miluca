import { Navigate } from 'react-router-dom';
import { useAtom } from 'jotai';
import { userAtom } from '../store/UserAtom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'seller')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/' 
}: ProtectedRouteProps) {
  const [user] = useAtom(userAtom);

  // Si no hay usuario, redirigir al login (pero en tu caso ya estás manejando esto)
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si se especificaron roles y el usuario no tiene uno permitido
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}