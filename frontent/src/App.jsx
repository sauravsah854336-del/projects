import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import VendorSignup from "./pages/VendorSignup";
import VendorLogin from "./pages/VendorLogin";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCouponsPage from "./pages/admin/AdminCouponsPage";
import VendorDashboard from "./pages/VendorDashboard";
import VendorProfilePage from "./pages/VendorProfilePage";
import AdminProfilePage from "./pages/AdminProfilePage";
import Unauthorized from "./pages/Unauthorized";
import Home from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import ProfilePage from "./pages/ProfilePage";
import WishlistPage from "./pages/WishlistPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import HelpPage from "./pages/HelpPage";
import PolicyPage from "./pages/PolicyPage";
import NotFoundPage from "./pages/NotFoundPage";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import AuthVerifier from "./components/AuthVerifier";
import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import ToastContainer from "./components/Toast";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthVerifier>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/help" element={<HelpPage />} />
            <Route path="/policy/:slug" element={<PolicyPage />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />

            <Route
              path="/signup"
              element={
                <PublicRoute>
                  <Signup />
                </PublicRoute>
              }
            />

            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />

            <Route
              path="/vendor/login"
              element={
                <PublicRoute>
                  <VendorLogin />
                </PublicRoute>
              }
            />

            <Route
              path="/vendor/signup"
              element={
                <PublicRoute>
                  <VendorSignup />
                </PublicRoute>
              }
            />

            <Route path="/dashboard" element={<Navigate to="/" replace />} />

            <Route
              path="/checkout"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <CheckoutPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <OrdersPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/orders/:id"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <OrderDetailPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute allowedRoles={["customer"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/coupons"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminCouponsPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/profile"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminProfilePage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/dashboard"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/vendor/profile"
              element={
                <ProtectedRoute allowedRoles={["vendor"]}>
                  <VendorProfilePage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>
        <ToastContainer />
      </AuthVerifier>
    </BrowserRouter>
  );
}

export default App;