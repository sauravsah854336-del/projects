import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyAuthQuery } from "../features/auth/authApi";
import {
  setVerifiedUser,
  setAuthChecked,
  logout,
} from "../features/auth/authSlice";

const AuthVerifier = ({ children }) => {
  const dispatch = useDispatch();
  const { token, isAuthChecked } = useSelector((state) => state.auth);
  const prevTokenRef = useRef(token);

  const { data, error, isLoading, isFetching } = useVerifyAuthQuery(token, {
    skip: !token,
    refetchOnMountOrArgChange: true,
  });

  useEffect(() => {
    if (prevTokenRef.current !== token) {
      prevTokenRef.current = token;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      dispatch(setAuthChecked());
      return;
    }

    if (isFetching) return;

    if (data?.success) {
      dispatch(setVerifiedUser(data.user));
      return;
    }

    if (error) {
      dispatch(logout());
      return;
    }
  }, [token, data, error, isFetching, dispatch]);

  if (!token && isAuthChecked) {
    return children;
  }

  if (!isAuthChecked || isLoading || isFetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  return children;
};

export default AuthVerifier;