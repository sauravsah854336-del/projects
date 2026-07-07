const bcrypt = require("bcryptjs");
const {
  getUserById,
  getUserByIdWithPassword,
  updateUser,
  addAddress,
  updateAddress: updateAddressInDB,
  deleteAddress: deleteAddressFromDB,
  setDefaultAddress: setDefaultAddressInDB,
  addToWishlist: addToWishlistInDB,
  removeFromWishlist: removeFromWishlistInDB,
} = require("../models/dynamodb/userModel");
const { getUserOrders } = require("../models/dynamodb/orderModel");
const { getProductById } = require("../models/dynamodb/productModel");
const { getVendorById } = require("../models/dynamodb/vendorModel");
const { getCategoryById } = require("../models/dynamodb/categoryModel");

const getProfile = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const ordersResult = await getUserOrders(req.user.id, { page: 1, limit: 1000 });
    const orders = ordersResult.items;

    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const totalSaved = orders.reduce((sum, o) => sum + (o.discount || 0), 0);
    const couponOrders = orders.filter((o) => o.couponCode).length;
    const uniqueCoupons = [...new Set(orders.filter((o) => o.couponCode).map((o) => o.couponCode))];

    const userData = {
      _id: user._id,
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      dialCode: user.dialCode,
      fullPhone: user.fullPhone,
      avatar: user.avatar,
      role: user.role,
      status: user.status,
      dateOfBirth: user.dateOfBirth,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      preferredCountry: user.preferredCountry,
      preferredCurrency: user.preferredCurrency,
      addresses: user.addresses,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      stats: {
        totalOrders,
        totalSpent,
        totalSaved,
        couponOrders,
        uniqueCouponsUsed: uniqueCoupons.length,
        couponsUsed: uniqueCoupons,
      },
    };

    return res.status(200).json({ success: true, data: userData });
  } catch (err) {
    console.error("getProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, avatar } = req.body;

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const updates = {};
    if (firstName) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (phone) updates.phone = phone.trim();
    if (dateOfBirth !== undefined) updates.dateOfBirth = dateOfBirth || null;
    if (avatar !== undefined) updates.avatar = avatar;

    const updated = await updateUser(req.user.id, updates);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("updateProfile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current password and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Must contain at least one uppercase letter" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ success: false, message: "Must contain at least one number" });
    }

    const user = await getUserByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.status(400).json({ success: false, message: "New password cannot be same as current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await updateUser(req.user.id, { password: hashedPassword });

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("changePassword error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const addAddressHandler = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, country, postalCode, isDefault } = req.body;

    if (!fullName || !phone || !street || !city || !state || !postalCode) {
      return res.status(400).json({ success: false, message: "All address fields are required" });
    }

    const addresses = await addAddress(req.user.id, {
      fullName: fullName.trim(),
      phone: phone.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim(),
      country: country?.trim() || "India",
      postalCode: postalCode.trim(),
      isDefault: isDefault || false,
    });

    if (!addresses) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      data: addresses,
    });
  } catch (err) {
    console.error("addAddress error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const updateAddressHandler = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { fullName, phone, street, city, state, country, postalCode, isDefault } = req.body;

    const updates = {};
    if (fullName) updates.fullName = fullName.trim();
    if (phone) updates.phone = phone.trim();
    if (street) updates.street = street.trim();
    if (city) updates.city = city.trim();
    if (state) updates.state = state.trim();
    if (country) updates.country = country.trim();
    if (postalCode) updates.postalCode = postalCode.trim();
    if (isDefault !== undefined) updates.isDefault = isDefault;

    const addresses = await updateAddressInDB(req.user.id, addressId, updates);

    if (!addresses) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: addresses,
    });
  } catch (err) {
    console.error("updateAddress error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const deleteAddressHandler = async (req, res) => {
  try {
    const { addressId } = req.params;

    const addresses = await deleteAddressFromDB(req.user.id, addressId);

    if (!addresses) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: addresses,
    });
  } catch (err) {
    console.error("deleteAddress error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const setDefaultAddressHandler = async (req, res) => {
  try {
    const { addressId } = req.params;

    const addresses = await setDefaultAddressInDB(req.user.id, addressId);

    if (!addresses) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Default address updated",
      data: addresses,
    });
  } catch (err) {
    console.error("setDefaultAddress error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getWishlist = async (req, res) => {
  try {
    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const wishlistIds = user.wishlist || [];
    const activeWishlist = [];

    for (const productId of wishlistIds) {
      try {
        const product = await getProductById(productId);
        if (product && product.stock !== undefined && !product.isDeleted) {
          let vendorData = null;
          let categoryData = null;

          try {
            vendorData = await getVendorById(product.vendorStoreId);
          } catch (e) {}

          try {
            const catId = product.category?._id || product.category;
            if (catId) categoryData = await getCategoryById(catId);
          } catch (e) {}

          activeWishlist.push({
            _id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            comparePrice: product.comparePrice,
            images: product.images,
            stock: product.stock,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews,
            brand: product.brand,
            isFeatured: product.isFeatured,
            vendorStore: vendorData ? { storeName: vendorData.storeName } : null,
            category: categoryData ? { name: categoryData.name } : null,
          });
        }
      } catch (e) {}
    }

    return res.status(200).json({
      success: true,
      data: activeWishlist,
      total: activeWishlist.length,
    });
  } catch (err) {
    console.error("getWishlist error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "Product ID is required" });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if ((user.wishlist || []).includes(productId)) {
      return res.status(400).json({ success: false, message: "Product already in wishlist" });
    }

    const wishlist = await addToWishlistInDB(req.user.id, productId);

    return res.status(200).json({
      success: true,
      message: "Added to wishlist",
      total: wishlist.length,
    });
  } catch (err) {
    console.error("addToWishlist error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await removeFromWishlistInDB(req.user.id, productId);

    return res.status(200).json({
      success: true,
      message: "Removed from wishlist",
      total: wishlist?.length || 0,
    });
  } catch (err) {
    console.error("removeFromWishlist error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const mergeWishlist = async (req, res) => {
  try {
    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(200).json({ success: true, message: "No items to merge" });
    }

    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const existingIds = user.wishlist || [];

    for (const pid of productIds) {
      if (!existingIds.includes(pid)) {
        await addToWishlistInDB(req.user.id, pid);
      }
    }

    const updatedUser = await getUserById(req.user.id);

    return res.status(200).json({
      success: true,
      message: `Merged ${productIds.length} wishlist items`,
      total: updatedUser.wishlist?.length || 0,
    });
  } catch (err) {
    console.error("mergeWishlist error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  addAddress: addAddressHandler,
  updateAddress: updateAddressHandler,
  deleteAddress: deleteAddressHandler,
  setDefaultAddress: setDefaultAddressHandler,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  mergeWishlist,
};