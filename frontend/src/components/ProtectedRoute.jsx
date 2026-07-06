import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, isAuthChecked } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!user || !token) {
    const fullPath = location.pathname + location.search;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(fullPath)}`}
        replace
      />
    );
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === "vendor") {
      return <Navigate to="/vendor/dashboard" replace />;
    }
    if (user.role === "customer") {
      return <Navigate to="/" replace />;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;