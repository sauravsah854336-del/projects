import { useSelector } from "react-redux";
import { Navigate, useSearchParams } from "react-router-dom";

const PublicRoute = ({ children }) => {
  const { user, token, isAuthChecked } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  if (!isAuthChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (user && token) {
    if (user.role === "admin") {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === "vendor") {
      return <Navigate to="/vendor/dashboard" replace />;
    }
    if (user.role === "customer") {
      return <Navigate to={redirectPath || "/"} replace />;
    }
  }

  return children;
};

export default PublicRoute;