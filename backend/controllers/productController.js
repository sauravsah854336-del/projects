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
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getVendorProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = { vendor: req.user.id, isDeleted: false };
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
    return res.status(500).json({ success: false, message: "Server error" });
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

    if (name) {
      product.name = name.trim();
      let slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
      const existSlug = await Product.findOne({ slug, _id: { $ne: id } });
      if (existSlug) slug = `${slug}-${Date.now()}`;
      product.slug = slug;
    }

    if (description) product.description = description.trim();
    if (shortDescription !== undefined) product.shortDescription = shortDescription;
    if (category) {
      const catExists = await Category.findById(category);
      if (!catExists) return res.status(404).json({ success: false, message: "Category not found" });
      product.category = category;
    }
    if (brand !== undefined) product.brand = brand;
    if (price !== undefined) product.price = price;
    if (comparePrice !== undefined) product.comparePrice = comparePrice;
    if (costPrice !== undefined) product.costPrice = costPrice;
    if (images) product.images = images;
    if (variants) product.variants = variants;
    if (specifications) product.specifications = specifications;
    if (stock !== undefined) product.stock = stock;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = lowStockThreshold;
    if (sku !== undefined) product.sku = sku;
    if (weight !== undefined) product.weight = weight;
    if (dimensions) product.dimensions = dimensions;
    if (tags) product.tags = tags;

    await product.save();

    return res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (err) {
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

    product.isDeleted = true;
    product.isActive = false;
    await product.save();

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const { category, brand, minPrice, maxPrice, sort, search } = req.query;

    const filter = { status: "approved", isActive: true, isDeleted: false };

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
        isDeleted: false,
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
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug, isDeleted: false })
      .populate("category", "name slug")
      .populate("vendor", "firstName")
      .populate("vendorStore", "storeName storeLogo");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    product.views += 1;
    await product.save();

    return res.status(200).json({ success: true, data: product });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const adminGetAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { status, search, vendor } = req.query;

    const filter = { isDeleted: false };
    if (status) filter.status = status;
    if (vendor) filter.vendor = vendor;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
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
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const featureProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product.isFeatured = !product.isFeatured;
    await product.save();

    return res.status(200).json({
      success: true,
      message: product.isFeatured ? "Product featured" : "Product unfeatured",
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const delistProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product.status = "delisted";
    product.isActive = false;
    product.delistReason = reason || "Violated platform policies";
    await product.save();

    return res.status(200).json({ success: true, message: "Product delisted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const relistProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    product.status = "approved";
    product.isActive = true;
    product.delistReason = "";
    await product.save();

    return res.status(200).json({ success: true, message: "Product relisted" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.id;

    const [totalProducts, approvedProducts, outOfStockProducts] = await Promise.all([
      Product.countDocuments({ vendor: vendorId, isDeleted: false }),
      Product.countDocuments({ vendor: vendorId, isDeleted: false, status: "approved" }),
      Product.countDocuments({ vendor: vendorId, isDeleted: false, status: "approved", stock: 0 }),
    ]);

    const activeProducts = await Product.find({
      vendor: vendorId,
      isDeleted: false,
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
      isDeleted: false,
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
    return res.status(500).json({ success: false, message: err.message || "Server error" });
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