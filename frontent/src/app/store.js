import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";
import authReducer from "../features/auth/authSlice";
import countryReducer from "../features/country/countrySlice";
import { productApi } from "../features/product/productApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    country: countryReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});