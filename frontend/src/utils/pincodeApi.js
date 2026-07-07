const PINCODE_API = "https://api.postalpincode.in/pincode";

export const verifyPincode = async (pincode) => {
  if (!/^\d{6}$/.test(pincode)) {
    return { valid: false, error: "Invalid pincode format" };
  }

  try {
    const response = await fetch(`${PINCODE_API}/${pincode}`);
    const data = await response.json();

    if (!data || !data[0] || data[0].Status !== "Success") {
      return { valid: false, error: "Pincode not serviceable" };
    }

    const postOffices = data[0].PostOffice || [];
    if (postOffices.length === 0) {
      return { valid: false, error: "No delivery available" };
    }

    const primary = postOffices[0];

    return {
      valid: true,
      pincode,
      city: primary.District,
      state: primary.State,
      country: primary.Country,
      area: primary.Name,
      region: primary.Region,
      division: primary.Division,
      postOffices: postOffices.map((p) => p.Name),
    };
  } catch (err) {
    return { valid: false, error: "Failed to verify pincode. Try again." };
  }
};

export const estimateDeliveryDays = (state) => {
  const metroStates = ["Karnataka", "Maharashtra", "Delhi", "Tamil Nadu", "Telangana"];
  const nearbyStates = ["Kerala", "Andhra Pradesh", "Gujarat", "Uttar Pradesh", "Haryana"];

  if (metroStates.includes(state)) return { min: 2, max: 4 };
  if (nearbyStates.includes(state)) return { min: 3, max: 6 };
  return { min: 5, max: 8 };
};

export const getDeliveryDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const PINCODE_STORAGE_KEY = "checkedPincode";

export const savePincodeToStorage = (pincodeData) => {
  try {
    localStorage.setItem(PINCODE_STORAGE_KEY, JSON.stringify(pincodeData));
  } catch (e) {}
};

export const getPincodeFromStorage = () => {
  try {
    const data = localStorage.getItem(PINCODE_STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
};

export const clearPincodeFromStorage = () => {
  try {
    localStorage.removeItem(PINCODE_STORAGE_KEY);
  } catch (e) {}
};