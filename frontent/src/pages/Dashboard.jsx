import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { authApi, useLogoutMutation } from "../features/auth/authApi";
import { useNavigate, Link } from "react-router-dom";

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state) => state.auth);
  const [logoutAPI, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutAPI({ refreshToken }).unwrap();
    } catch (err) {
      console.log(err);
    } finally {
      dispatch(authApi.util.resetApiState());
      dispatch(logout());
      navigate("/login");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-gray-500">Welcome back, {user?.firstName}</p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoading}
          className="bg-red-500 text-white px-4 py-2 rounded-lg"
        >
          {isLoading ? "..." : "Logout"}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link
          to="/orders"
          className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition no-underline"
        >
          <div className="text-3xl mb-2">📦</div>
          <p className="font-semibold text-gray-900">My Orders</p>
          <p className="text-sm text-gray-500">View order history</p>
        </Link>

        <Link
          to="/cart"
          className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition no-underline"
        >
          <div className="text-3xl mb-2">🛒</div>
          <p className="font-semibold text-gray-900">My Cart</p>
          <p className="text-sm text-gray-500">View saved items</p>
        </Link>

        <Link
          to="/products"
          className="bg-white rounded-2xl border border-gray-100 p-6 text-center hover:shadow-md transition no-underline"
        >
          <div className="text-3xl mb-2">🛍️</div>
          <p className="font-semibold text-gray-900">Shop Now</p>
          <p className="text-sm text-gray-500">Browse products</p>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;