import { createSlice } from "@reduxjs/toolkit";

const savedCountry = JSON.parse(localStorage.getItem("userCountry") || "null");

const initialState = {
  currentCountry: savedCountry || {
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
  },
  allCountries: [],
  isDetecting: false,
};

const countrySlice = createSlice({
  name: "country",
  initialState,
  reducers: {
    setCountry: (state, action) => {
      state.currentCountry = action.payload;
      localStorage.setItem("userCountry", JSON.stringify(action.payload));
    },
    setAllCountries: (state, action) => {
      state.allCountries = action.payload;
    },
    setDetecting: (state, action) => {
      state.isDetecting = action.payload;
    },
  },
});

export const { setCountry, setAllCountries, setDetecting } = countrySlice.actions;
export default countrySlice.reducer;