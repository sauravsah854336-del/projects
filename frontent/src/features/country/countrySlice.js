import { createSlice } from "@reduxjs/toolkit";

const savedCountry = JSON.parse(localStorage.getItem("userCountry") || "null");
const savedIsUserCountry = localStorage.getItem("isUserCountry") === "true";

const defaultCountry = {
  code: "IN",
  name: "India",
  flag: "🇮🇳",
  currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
  exchangeRate: 1,
  tax: { type: "GST", rate: 18, label: "GST", includedInPrice: true },
  shipping: {
    freeShippingThreshold: 499,
    standardCost: 49,
    expressCost: 99,
    estimatedDays: { standard: 5, express: 2 },
  },
  paymentMethods: ["cod", "card", "upi", "netbanking"],
};

const initialState = {
  currentCountry: savedCountry || defaultCountry,
  allCountries: [],
  isDetecting: false,
  isUserCountry: savedIsUserCountry,
};

const countrySlice = createSlice({
  name: "country",
  initialState,
  reducers: {
    setCountry: (state, action) => {
      state.currentCountry = action.payload;
      state.isUserCountry = false;
      localStorage.setItem("userCountry", JSON.stringify(action.payload));
      localStorage.setItem("isUserCountry", "false");
    },

    setUserCountry: (state, action) => {
      if (action.payload) {
        state.currentCountry = action.payload;
        state.isUserCountry = true;
        localStorage.setItem("userCountry", JSON.stringify(action.payload));
        localStorage.setItem("isUserCountry", "true");
      }
    },

    setAllCountries: (state, action) => {
      state.allCountries = action.payload;
    },

    setDetecting: (state, action) => {
      state.isDetecting = action.payload;
    },

    resetCountry: (state) => {
      state.currentCountry = defaultCountry;
      state.isUserCountry = false;
      localStorage.removeItem("userCountry");
      localStorage.removeItem("isUserCountry");
    },
  },
});

export const {
  setCountry,
  setUserCountry,
  setAllCountries,
  setDetecting,
  resetCountry,
} = countrySlice.actions;

export default countrySlice.reducer;