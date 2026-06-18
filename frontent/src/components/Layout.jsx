import Navbar from "./Navbar";
import Footer from "./Footer";
import CategorySidebar from "./CategorySidebar";
import { useLocation } from "react-router-dom";

const Layout = ({ children }) => {
  const location = useLocation();

  // Hide sidebar on these pages
  const hideSidebarPaths = [
    "/login",
    "/signup",
    "/vendor/login",
    "/vendor/signup",
    "/unauthorized",
    "/checkout",
  ];

  const hideSidebar =
    hideSidebarPaths.includes(location.pathname) ||
    location.pathname.startsWith("/admin/") ||
    location.pathname.startsWith("/vendor/dashboard");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#EAEDED" }}>
      <Navbar />

      <div style={{ flex: 1, display: "flex", maxWidth: "100%" }}>
        {!hideSidebar && <CategorySidebar />}

        <main style={{ flex: 1, minWidth: 0 }}>
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;