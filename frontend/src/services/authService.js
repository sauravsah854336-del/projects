import axiosInstance from "./axiosInstance";

export const signupAPI = (data) => {
  return axiosInstance.post("/auth/signup", data);
};

export const loginAPI = (data) => {
  return axiosInstance.post("/auth/login", data);
};

