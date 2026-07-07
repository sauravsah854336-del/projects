const bcrypt = require("bcryptjs");
const { createUser, getUsersByRole } = require("../models/dynamodb/userModel");

const setupFirstAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingAdmins = await getUsersByRole("admin", 1);
    if (existingAdmins.items.length > 0) {
      return res.status(409).json({ success: false, message: "Admin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await createUser({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: "admin",
      status: "active",
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      data: { adminId: user._id },
    });
  } catch (err) {
    console.error("setupFirstAdmin error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { setupFirstAdmin };