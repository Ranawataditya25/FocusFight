import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ user, loading }) => {
  if (loading) return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
};

export default ProtectedRoute;
