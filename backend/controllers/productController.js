const Product = require("../models/product");
const Vendor = require("../models/vendors");
const Order = require("../models/order");
const Category = require("../models/category");

const createProduct = async (req, res) => {
  try {
    const {
      name, description, shortDescription, category, brand,
      price, comparePrice, costPrice, images, variants,
      specifications, stock, lowStockThreshold, sku, weight, dimensions, tags,
    } = req.body;

    if (!name || !description || !category || !price || stock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Name, description, category, price and stock are required",
      });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const vendor = await Vendor.findOne({ userId: req.user.id });
    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor profile not found" });
    }

    if (vendor.approvalStatus !== "approved") {
      return res.status(403).json({ success: false, message: "Vendor account is not approved" });
    }

    let slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const existSlug = await Product.findOne({ slug });
    if (existSlug) slug = `${slug}-${Date.now()}`;

    const product = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      shortDescription: shortDescription || "",
      category,
      brand: brand || "",
      price,
      basePrice: price,
      baseCurrency: "INR",
      comparePrice: comparePrice || 0,
      costPrice: costPrice || 0,
      images: images || [],
      variants: variants || [],
      specifications: specifications || [],
      stock,
      lowStockThreshold: lowStockThreshold || 5,
      sku: sku || "",
      weight: weight || 0,
      dimensions: dimensions || { length: 0, width: 0, height: 0 },
      vendor: req.user.id,
      vendorStore: vendor._id,
      tags: tags || [],
      status: "approved",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Product listed successfully.",
      data: product,
    });
  } catch (err) {
    console.error("createProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getVendorProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = { vendor: req.user.id, isDeleted: { $ne: true } };
    if (status) filter.status = status;

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getVendorProducts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (product.status === "delisted") {
      return res.status(400).json({ success: false, message: "Cannot edit a delisted product" });
    }

    const {
      name, description, shortDescription, category, brand,
      price, comparePrice, costPrice, images, variants,
      specifications, stock, lowStockThreshold, sku, weight, dimensions, tags,
    } = req.body;

    const updateData = {};

    if (name) {
      updateData.name = name.trim();
      let slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const existSlug = await Product.findOne({ slug, _id: { $ne: id } });
      if (existSlug) slug = `${slug}-${Date.now()}`;
      updateData.slug = slug;
    }

    if (description) updateData.description = description.trim();
    if (shortDescription !== undefined) updateData.shortDescription = shortDescription;
    if (category) {
      const catExists = await Category.findById(category);
      if (!catExists) return res.status(404).json({ success: false, message: "Category not found" });
      updateData.category = category;
    }
    if (brand !== undefined) updateData.brand = brand;
    if (price !== undefined) {
      updateData.price = price;
      updateData.basePrice = price;
    }
    if (comparePrice !== undefined) updateData.comparePrice = comparePrice;
    if (costPrice !== undefined) updateData.costPrice = costPrice;
    if (images) updateData.images = images;
    if (variants) updateData.variants = variants;
    if (specifications) updateData.specifications = specifications;
    if (stock !== undefined) updateData.stock = stock;
    if (lowStockThreshold !== undefined) updateData.lowStockThreshold = lowStockThreshold;
    if (sku !== undefined) updateData.sku = sku;
    if (weight !== undefined) updateData.weight = weight;
    if (dimensions) updateData.dimensions = dimensions;
    if (tags) updateData.tags = tags;

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true })
      .populate("category", "name slug");

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: updated,
    });
  } catch (err) {
    console.error("updateProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.vendor.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await Product.findByIdAndUpdate(id, { isDeleted: true, isActive: false });

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("deleteProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, brand, minPrice, maxPrice, sort, search } = req.query;

    const filter = { status: "approved", isActive: true, isDeleted: { $ne: true } };

    if (category) {
      const subcategories = await Category.find({ parent: category }).select("_id");
      const categoryIds = [category, ...subcategories.map((s) => s._id)];
      filter.category = { $in: categoryIds };
    }
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      const matchingCategories = await Category.find({ name: regex }).select("_id");
      const matchingVendors = await Vendor.find({
        storeName: regex,
        approvalStatus: "approved",
        isDeleted: { $ne: true },
      }).select("userId");

      filter.$or = [
        { name: regex },
        { description: regex },
        { shortDescription: regex },
        { brand: regex },
        { tags: regex },
      ];

      if (matchingCategories.length > 0) {
        filter.$or.push({ category: { $in: matchingCategories.map((c) => c._id) } });
      }
      if (matchingVendors.length > 0) {
        filter.$or.push({ vendor: { $in: matchingVendors.map((v) => v.userId) } });
      }
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { price: 1 };
    if (sort === "price_high") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { averageRating: -1 };
    if (sort === "popular") sortOption = { totalSold: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("vendor", "firstName")
      .populate("vendorStore", "storeName")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("getAllProducts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, isDeleted: { $ne: true } })
      .populate("category", "name slug")
      .populate("vendor", "firstName")
      .populate("vendorStore", "storeName storeLogo");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await Product.findByIdAndUpdate(product._id, { $inc: { views: 1 } });

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    console.error("getSingleProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const adminGetAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, search, vendor } = req.query;

    const filter = { isDeleted: { $ne: true } };

    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      filter.$or = [
        { name: regex },
        { brand: regex },
        { sku: regex },
        { description: regex },
      ];
    }

    const products = await Product.find(filter)
      .populate("category", "name slug")
      .populate("vendor", "firstName lastName email")
      .populate("vendorStore", "storeName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    return res.status(200).json({
      success: true,
      data: products,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("adminGetAllProducts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const featureProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await Product.findByIdAndUpdate(id, { isFeatured: !product.isFeatured });

    return res.status(200).json({
      success: true,
      message: product.isFeatured ? "Product unfeatured" : "Product featured",
    });
  } catch (err) {
    console.error("featureProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const delistProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await Product.findByIdAndUpdate(id, {
      status: "delisted",
      isActive: false,
      delistReason: reason || "Violated platform policies",
    });

    return res.status(200).json({ success: true, message: "Product delisted" });
  } catch (err) {
    console.error("delistProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const relistProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await Product.findByIdAndUpdate(id, {
      status: "approved",
      isActive: true,
      delistReason: "",
    });

    return res.status(200).json({ success: true, message: "Product relisted" });
  } catch (err) {
    console.error("relistProduct error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const [totalProducts, approvedProducts, outOfStockProducts] = await Promise.all([
      Product.countDocuments({ vendor: vendorId, isDeleted: { $ne: true } }),
      Product.countDocuments({ vendor: vendorId, isDeleted: { $ne: true }, status: "approved" }),
      Product.countDocuments({ vendor: vendorId, isDeleted: { $ne: true }, status: "approved", stock: 0 }),
    ]);

    const activeProducts = await Product.find({
      vendor: vendorId,
      isDeleted: { $ne: true },
      status: "approved",
      stock: { $gt: 0 },
    }).select("stock lowStockThreshold");

    const lowStockProducts = activeProducts.filter(
      (p) => p.stock <= (p.lowStockThreshold || 5)
    ).length;

    const now = new Date();
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const allVendorOrders = await Order.find({ "items.vendor": vendorId }).lean();

    const orderCounts = {
      total: allVendorOrders.length,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      out_for_delivery: 0,
      delivered: 0,
      cancelled: 0,
      last7Days: 0,
      last30Days: 0,
    };

    allVendorOrders.forEach((order) => {
      if (order.orderStatus in orderCounts) {
        orderCounts[order.orderStatus]++;
      }
      const createdAt = new Date(order.createdAt);
      if (createdAt >= last7Days) orderCounts.last7Days++;
      if (createdAt >= last30Days) orderCounts.last30Days++;
    });

    const getVendorRevenue = (order) => {
      return order.items
        .filter((item) => item.vendor?.toString() === vendorId.toString())
        .reduce((sum, item) => sum + item.price * item.quantity, 0);
    };

    const deliveredOrders = allVendorOrders.filter((o) => o.orderStatus === "delivered");

    const totalRevenue = deliveredOrders.reduce((sum, order) => sum + getVendorRevenue(order), 0);

    const thisMonthRevenue = deliveredOrders
      .filter((o) => new Date(o.createdAt) >= startOfThisMonth)
      .reduce((sum, order) => sum + getVendorRevenue(order), 0);

    const lastMonthRevenue = deliveredOrders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= startOfLastMonth && d <= endOfLastMonth;
      })
      .reduce((sum, order) => sum + getVendorRevenue(order), 0);

    const monthlyGrowth =
      lastMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : thisMonthRevenue > 0
        ? 100
        : 0;

    const dailyRevenue = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0];
      dailyRevenue[key] = 0;
    }

    deliveredOrders.forEach((order) => {
      const key = new Date(order.createdAt).toISOString().split("T")[0];
      if (key in dailyRevenue) {
        dailyRevenue[key] += getVendorRevenue(order);
      }
    });

    const topProducts = await Product.find({
      vendor: vendorId,
      isDeleted: { $ne: true },
      status: "approved",
      totalSold: { $gt: 0 },
    })
      .sort({ totalSold: -1 })
      .limit(5)
      .select("name price images averageRating totalSold")
      .lean();

    const vendorProfile = await Vendor.findOne({ userId: vendorId })
      .select("storeName commission")
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          monthlyGrowth: monthlyGrowth,
          daily: dailyRevenue,
        },
        orders: orderCounts,
        products: {
          total: totalProducts,
          approved: approvedProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockProducts,
        },
        topProducts,
        store: {
          storeName: vendorProfile?.storeName || "",
          commission: vendorProfile?.commission || 10,
        },
      },
    });
  } catch (err) {
    console.error("getVendorStats error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createProduct,
  getVendorProducts,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getSingleProduct,
  adminGetAllProducts,
  featureProduct,
  delistProduct,
  relistProduct,
  getVendorStats,
};