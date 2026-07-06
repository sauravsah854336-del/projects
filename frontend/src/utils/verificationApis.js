import { API_URL } from "./apiConfig";

export const verifyIFSC = async (ifscCode) => {
  try {
    const res = await fetch(`https://ifsc.razorpay.com/${ifscCode.trim().toUpperCase()}`);

    if (!res.ok) {
      return { success: false, message: "Invalid IFSC code" };
    }

    const data = await res.json();

    return {
      success: true,
      bankName: data.BANK || "",
      branch: data.BRANCH || "",
      city: data.CITY || "",
      state: data.STATE || "",
      address: data.ADDRESS || "",
      center: data.CENTRE || "",
    };
  } catch {
    return { success: false, message: "Failed to verify IFSC code" };
  }
};

export const verifyPinCode = async (pincode) => {
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode.trim()}`);
    const data = await res.json();

    if (!data || !data[0] || data[0].Status !== "Success" || !data[0].PostOffice?.length) {
      return { success: false, message: "Invalid PIN code" };
    }

    const po = data[0].PostOffice[0];

    return {
      success: true,
      city: po.District || po.Division || "",
      state: po.State || "",
      country: po.Country || "India",
      region: po.Region || "",
      area: po.Name || "",
    };
  } catch {
    return { success: false, message: "Failed to verify PIN code" };
  }
};

export const checkStoreName = async (name) => {
  try {
    const res = await fetch(
      `${API_URL}/vendor/check-store-name?name=${encodeURIComponent(name.trim())}`
    );
    const data = await res.json();

    return {
      success: true,
      available: data.available,
      message: data.message,
    };
  } catch {
    return { success: false, available: false, message: "Failed to check" };
  }
};

export const validateGSTNumber = (gst, pan) => {
  if (!gst || gst.length !== 15) {
    return { valid: false, message: "GST number must be 15 characters" };
  }

  const gstUpper = gst.toUpperCase();

  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstRegex.test(gstUpper)) {
    return { valid: false, message: "Invalid GST format" };
  }

  const stateCode = parseInt(gstUpper.substring(0, 2), 10);
  const validStateCodes = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37,
  ];
  if (!validStateCodes.includes(stateCode)) {
    return { valid: false, message: "Invalid state code in GST" };
  }

  const panInGST = gstUpper.substring(2, 12);
  if (pan && pan.trim().length === 10) {
    if (panInGST !== pan.trim().toUpperCase()) {
      return { valid: false, message: "PAN in GST does not match your PAN number" };
    }
  }

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const gstChars = gstUpper.split("");
  let sum = 0;

  for (let i = 0; i < 14; i++) {
    const index = chars.indexOf(gstChars[i]);
    const product = index * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }

  const checkDigit = (36 - (sum % 36)) % 36;
  const expectedCheck = chars[checkDigit];

  if (gstChars[14] !== expectedCheck) {
    return { valid: false, message: "GST checksum invalid — this may be a fake number" };
  }

  return { valid: true, message: "GST number is valid" };
};