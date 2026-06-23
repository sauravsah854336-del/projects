const User = require("../models/users");
const Vendor = require("../models/vendors");
const bcrypt = require("bcryptjs");

const createAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password } = req.body;

    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existUser = await User.findOne({ email: normalizedEmail });
    if (existUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      firstName,
      lastName,
      email: normalizedEmail,
      phone,
      password: hashedPassword,
      role: "admin",
    });

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      data: { adminId: user._id },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

const getPendingVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find({ approvalStatus: "pending" })
      .populate("userId", "firstName lastName email phone createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const getAllVendors = async (req, res) => {
  try {
    const vendors = await Vendor.find()
      .populate("userId", "firstName lastName email phone status createdAt")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: vendors,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    if (vendor.approvalStatus === "approved") {
      return res.status(400).json({
        success: false,
        message: "Vendor is already approved",
      });
    }

    vendor.approvalStatus = "approved";
    vendor.approvedAt = new Date();
    vendor.approvedBy = req.user.id;
    vendor.rejectionReason = "";
    await vendor.save();

    await User.findByIdAndUpdate(vendor.userId, { status: "active" });

    return res.status(200).json({
      success: true,
      message: "Vendor approved successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

const rejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor not found",
      });
    }

    vendor.approvalStatus = "rejected";
    vendor.rejectionReason = reason || "No reason provided";
    await vendor.save();

    await User.findByIdAndUpdate(vendor.userId, { status: "blocked" });

    return res.status(200).json({
      success: true,
      message: "Vendor rejected",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createAdmin,
  getPendingVendors,
  getAllVendors,
  approveVendor,
  rejectVendor,
};