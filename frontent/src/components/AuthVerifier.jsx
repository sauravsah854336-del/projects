import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useVerifyAuthQuery } from "../features/auth/authApi";
import {
  setVerifiedUser,
  setAuthChecked,
  logout,
} from "../features/auth/authSlice";
import { setUserCountry } from "../features/country/countrySlice";

const AuthVerifier = ({ children }) => {
  const dispatch = useDispatch();
  const { token, isAuthChecked } = useSelector((state) => state.auth);
  const prevTokenRef = useRef(token);
  const hasInitializedRef = useRef(false);

  const { data, error, isLoading, isFetching } = useVerifyAuthQuery(
    undefined,
    {
      skip: !token,
      refetchOnMountOrArgChange: false,
    }
  );

  useEffect(() => {
    if (prevTokenRef.current !== token) {
      prevTokenRef.current = token;
      hasInitializedRef.current = false;
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      if (!isAuthChecked) {
        dispatch(setAuthChecked());
      }
      return;
    }

    if (isFetching) return;

    if (data?.success && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      dispatch(setVerifiedUser(data.user));

      if (data.userCountry) {
        dispatch(setUserCountry(data.userCountry));
      }
      return;
    }

    if (error) {
      dispatch(logout());
      return;
    }
  }, [token, data, error, isFetching, dispatch, isAuthChecked]);

  if (!token && isAuthChecked) {
    return children;
  }

  if (!isAuthChecked || (token && isLoading)) {
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