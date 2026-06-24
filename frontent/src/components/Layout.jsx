import Navbar from "./Navbar";
import Footer from "./Footer";
import CategorySidebar from "./CategorySidebar";
import { useLocation } from "react-router-dom";

const hideSidebarPaths = [
  "/login",
  "/signup",
  "/vendor/login",
  "/vendor/signup",
  "/unauthorized",
  "/checkout",
  "/forgot-password",
];

const Layout = ({ children }) => {
  const location = useLocation();
  const hideSidebar = hideSidebarPaths.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#EAEDED]">
      <Navbar />

      <div className="flex-1 flex max-w-full">
        {!hideSidebar && <CategorySidebar />}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>

      <Footer />
    </div>
  );
};

export default Layout;