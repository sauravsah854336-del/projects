import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
      <p className="text-xl text-gray-700 mb-6">
        You do not have permission to access this page
      </p>
      <Link
        to="/"
        className="bg-black text-white px-6 py-3 rounded-xl"
      >
        Go Home
      </Link>
    </div>
  );
};

export default Unauthorized;