const Product = require("../models/product");
const Vendor = require("../models/vendors");
const Order = require("../models/order");
const Category = require("../models/category");

const generateUniqueSlug = async (name, vendorStoreName, excludeId = null) => {
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  const query = { slug };
  if (excludeId) query._id = { $ne: excludeId };

  const existSlug = await Product.findOne(query);
  if (!existSlug) return slug;

  const vendorPart = vendorStoreName
    ? vendorStoreName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20)
    : "";

  if (vendorPart) {
    slug = `${baseSlug}-${vendorPart}`;
    const query2 = { slug };
    if (excludeId) query2._id = { $ne: excludeId };
    const exists2 = await Product.findOne(query2);
    if (!exists2) return slug;
  }

  slug = `${baseSlug}-${Date.now()}`;
  return slug;
};

const checkDuplicateProduct = async (vendorId, { name, sku, modelNumber }, excludeProductId = null) => {
  const orConditions = [];

  if (name) {
    orConditions.push({
      name: { $regex: `^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });
  }

  if (sku && sku.trim()) {
    orConditions.push({ sku: sku.trim() });
  }

  if (modelNumber && modelNumber.trim()) {
    orConditions.push({ modelNumber: modelNumber.trim() });
  }

  if (orConditions.length === 0) return null;

  const query = {
    vendor: vendorId,
    isDeleted: { $ne: true },
    $or: orConditions,
  };

  if (excludeProductId) {
    query._id = { $ne: excludeProductId };
  }

  return await Product.findOne(query).select("name sku modelNumber slug");
};

const findSimilarProductsFromOtherVendors = async (vendorId, { modelNumber, brand, name }) => {
  const orConditions = [];

  if (modelNumber && modelNumber.trim() && brand && brand.trim()) {
    orConditions.push({
      modelNumber: modelNumber.trim(),
      brand: brand.trim(),
    });
  }

  if (orConditions.length === 0) return [];

  return await Product.find({
    vendor: { $ne: vendorId },
    status: "approved",
    isActive: true,
    isDeleted: { $ne: true },
    $or: orConditions,
  })
    .select("name price slug images vendorStore averageRating totalReviews stock")
    .populate("vendorStore", "storeName")
    .limit(5)
    .lean();
};

const createProduct = async (req, res) => {
  try {
    const {
      name, description, shortDescription, keyFeatures,
      category, brand, modelNumber,
      price, comparePrice, costPrice, bulkPricing,
      images, videoUrl, model3dUrl,
      colors, sizes, materials, variants, specifications,
      stock, lowStockThreshold, sku, barcode,
      weight, weightUnit, dimensions,
      roomType, assemblyRequired, assemblyTime,
      warranty, returnPolicy, shipping,
      faqs, seo, tags,
      availableCountries, restrictedCountries, shippingCountries,
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

    const duplicate = await checkDuplicateProduct(req.user.id, { name, sku, modelNumber });

    if (duplicate) {
  let field = "product";
  let value = "";
  let matchType = "";

  if (duplicate.name.toLowerCase() === name.trim().toLowerCase()) {
    field = "name";
    value = duplicate.name;
    matchType = "name";
  } else if (sku && duplicate.sku === sku.trim()) {
    field = "SKU";
    value = duplicate.sku;
    matchType = "sku";
  } else if (modelNumber && duplicate.modelNumber === modelNumber.trim()) {
    field = "model number";
    value = duplicate.modelNumber;
    matchType = "modelNumber";
  }

  return res.status(400).json({
    success: false,
    isDuplicate: true,
    duplicateType: "own_product",
    title: "You already sell this product",
    message: `You have "${duplicate.name}" in your inventory with the same ${field}.`,
    suggestion: "Update your existing product to change price, stock, or other details instead of creating a duplicate.",
    duplicate: {
      _id: duplicate._id,
      name: duplicate.name,
      slug: duplicate.slug,
      sku: duplicate.sku,
      modelNumber: duplicate.modelNumber,
      matchedField: field,
      matchType: matchType,
    },
    actions: {
      editUrl: `/vendor/products/edit/${duplicate._id}`,
      viewUrl: `/products/single/${duplicate.slug}`,
    },
  });
}

    const similarProducts = await findSimilarProductsFromOtherVendors(req.user.id, {
      modelNumber,
      brand,
      name,
    });

    const slug = await generateUniqueSlug(name, vendor.storeName);

    const product = await Product.create({
      name: name.trim(),
      slug,
      description: description.trim(),
      shortDescription: shortDescription || "",
      keyFeatures: keyFeatures || [],
      category,
      brand: brand?.trim() || "",
      modelNumber: modelNumber?.trim() || "",
      price,
      basePrice: price,
      baseCurrency: "INR",
      comparePrice: comparePrice || 0,
      costPrice: costPrice || 0,
      bulkPricing: bulkPricing || [],
      images: images || [],
      videoUrl: videoUrl || "",
      model3dUrl: model3dUrl || "",
      colors: colors || [],
      sizes: sizes || [],
      materials: materials || [],
      variants: variants || [],
      specifications: specifications || [],
      stock,
      lowStockThreshold: lowStockThreshold || 5,
      sku: sku?.trim() || "",
      barcode: barcode?.trim() || "",
      weight: weight || 0,
      weightUnit: weightUnit || "kg",
      dimensions: dimensions || { length: 0, width: 0, height: 0, unit: "cm" },
      roomType: roomType || [],
      assemblyRequired: assemblyRequired || false,
      assemblyTime: assemblyTime || 0,
      warranty: warranty || { duration: 0, unit: "months", type: "none", description: "" },
      returnPolicy: returnPolicy || { returnable: true, returnWindow: 10, returnConditions: "" },
      shipping: shipping || { isFreeShipping: false, shippingCost: 0, handlingTime: 1, estimatedDeliveryDays: 5 },
      faqs: faqs || [],
      seo: seo || { metaTitle: "", metaDescription: "", keywords: [] },
      tags: tags || [],
      availableCountries: availableCountries || [],
      restrictedCountries: restrictedCountries || [],
      shippingCountries: shippingCountries || [],
      vendor: req.user.id,
      vendorStore: vendor._id,
      status: "approved",
      isActive: true,
    });

    let priceRange = null;
if (similarProducts.length > 0) {
  const prices = similarProducts.map(p => p.price).filter(p => p > 0);
  if (prices.length > 0) {
    priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    };
  }
}

return res.status(201).json({
  success: true,
  message: "Product listed successfully!",
  data: product,
  competition: similarProducts.length > 0 ? {
    hasSimilar: true,
    count: similarProducts.length,
    priceRange,
    tips: [
      "Set competitive pricing to attract customers",
      "Upload high-quality product photos",
      "Offer fast shipping options",
      "Provide detailed product descriptions",
    ],
    sellers: similarProducts,
  } : null,
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

    const allowedFields = [
      "name", "description", "shortDescription", "keyFeatures",
      "category", "brand", "modelNumber",
      "price", "comparePrice", "costPrice", "bulkPricing",
      "images", "videoUrl", "model3dUrl",
      "colors", "sizes", "materials", "variants", "specifications",
      "stock", "lowStockThreshold", "sku", "barcode",
      "weight", "weightUnit", "dimensions",
      "roomType", "assemblyRequired", "assemblyTime",
      "warranty", "returnPolicy", "shipping",
      "faqs", "seo", "tags",
      "availableCountries", "restrictedCountries", "shippingCountries",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (updateData.name || updateData.sku || updateData.modelNumber) {
      const checkData = {
        name: updateData.name || product.name,
        sku: updateData.sku !== undefined ? updateData.sku : product.sku,
        modelNumber: updateData.modelNumber !== undefined ? updateData.modelNumber : product.modelNumber,
      };

      const nameChanged = updateData.name && updateData.name.trim().toLowerCase() !== product.name.toLowerCase();
      const skuChanged = updateData.sku !== undefined && updateData.sku.trim() !== (product.sku || "");
      const modelChanged = updateData.modelNumber !== undefined && updateData.modelNumber.trim() !== (product.modelNumber || "");

      if (nameChanged || skuChanged || modelChanged) {
        const duplicate = await checkDuplicateProduct(
          req.user.id,
          {
            name: nameChanged ? checkData.name : null,
            sku: skuChanged ? checkData.sku : null,
            modelNumber: modelChanged ? checkData.modelNumber : null,
          },
          id
        );

        if (duplicate) {
          let field = "product";
          let value = "";

          if (nameChanged && duplicate.name.toLowerCase() === checkData.name.trim().toLowerCase()) {
            field = "name";
            value = duplicate.name;
          } else if (skuChanged && duplicate.sku === checkData.sku.trim()) {
            field = "SKU";
            value = duplicate.sku;
          } else if (modelChanged && duplicate.modelNumber === checkData.modelNumber.trim()) {
            field = "model number";
            value = duplicate.modelNumber;
          }

          return res.status(400).json({
            success: false,
            message: `Another product "${duplicate.name}" already uses this ${field}: "${value}".`,
            duplicate: {
              _id: duplicate._id,
              name: duplicate.name,
              slug: duplicate.slug,
              matchedField: field,
            },
          });
        }
      }
    }

    if (updateData.name) {
      updateData.name = updateData.name.trim();
      const vendor = await Vendor.findOne({ userId: req.user.id });
      updateData.slug = await generateUniqueSlug(updateData.name, vendor?.storeName, id);
    }

    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.brand) updateData.brand = updateData.brand.trim();
    if (updateData.modelNumber) updateData.modelNumber = updateData.modelNumber.trim();
    if (updateData.sku) updateData.sku = updateData.sku.trim();
    if (updateData.barcode) updateData.barcode = updateData.barcode.trim();

    if (updateData.category) {
      const catExists = await Category.findById(updateData.category);
      if (!catExists) return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (updateData.price !== undefined) {
      updateData.basePrice = updateData.price;
    }

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

    const {
      category, brand, brands, minPrice, maxPrice,
      colors, sizes, materials, roomType,
      minRating, inStock, hasDiscount, isFeatured, isNewArrival,
      assemblyRequired, freeShipping,
      sort, search, filterType,
    } = req.query;

    const filter = { status: "approved", isActive: true, isDeleted: { $ne: true } };

    if (category) {
      const subcategories = await Category.find({ parent: category }).select("_id");
      const categoryIds = [category, ...subcategories.map((s) => s._id)];
      filter.category = { $in: categoryIds };
    }

    if (brand) filter.brand = brand;
    if (brands) {
      const brandArr = brands.split(",").filter(Boolean);
      if (brandArr.length) filter.brand = { $in: brandArr };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    if (colors) {
      const colorArr = colors.split(",").filter(Boolean);
      if (colorArr.length) filter["colors.name"] = { $in: colorArr };
    }

    if (sizes) {
      const sizeArr = sizes.split(",").filter(Boolean);
      if (sizeArr.length) filter["sizes.name"] = { $in: sizeArr };
    }

    if (materials) {
      const matArr = materials.split(",").filter(Boolean);
      if (matArr.length) filter.materials = { $in: matArr };
    }

    if (roomType) {
      const roomArr = roomType.split(",").filter(Boolean);
      if (roomArr.length) filter.roomType = { $in: roomArr };
    }

    if (minRating) filter.averageRating = { $gte: Number(minRating) };
    if (inStock === "true") filter.stock = { $gt: 0 };
    if (hasDiscount === "true") filter.$expr = { $gt: ["$comparePrice", "$price"] };
    if (isFeatured === "true") filter.isFeatured = true;
    if (isNewArrival === "true") filter.isNewArrival = true;
    if (assemblyRequired === "false") filter.assemblyRequired = false;
    if (freeShipping === "true") filter["shipping.isFreeShipping"] = true;

    if (filterType === "featured") filter.isFeatured = true;
    if (filterType === "topRated") filter.averageRating = { $gte: 4 };
    if (filterType === "bestSeller") filter.totalReviews = { $gte: 10 };
    if (filterType === "discount") filter.$expr = { $gt: ["$comparePrice", "$price"] };
    if (filterType === "newArrival") filter.isNewArrival = true;

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");

      const matchingCategories = await Category.find({ name: regex }).select("_id");
      const matchingVendors = await Vendor.find({
        storeName: regex,
        approvalStatus: "approved",
        isDeleted: { $ne: true },
      }).select("userId");

      const searchOr = [
        { name: regex },
        { description: regex },
        { shortDescription: regex },
        { brand: regex },
        { modelNumber: regex },
        { tags: regex },
        { keyFeatures: regex },
        { "colors.name": regex },
        { "sizes.name": regex },
        { materials: regex },
      ];

      if (matchingCategories.length > 0) {
        searchOr.push({ category: { $in: matchingCategories.map((c) => c._id) } });
      }
      if (matchingVendors.length > 0) {
        searchOr.push({ vendor: { $in: matchingVendors.map((v) => v.userId) } });
      }

      filter.$and = filter.$and || [];
      filter.$and.push({ $or: searchOr });
    }

    let sortOption = { createdAt: -1 };

    if (filterType === "topRated") sortOption = { averageRating: -1, totalReviews: -1 };
    else if (filterType === "bestSeller") sortOption = { totalSold: -1, totalReviews: -1 };
    else if (filterType === "discount") sortOption = { comparePrice: -1 };
    else if (filterType === "latest" || filterType === "newArrival") sortOption = { createdAt: -1 };
    else if (filterType === "featured") sortOption = { createdAt: -1 };

    if (sort === "price_low") sortOption = { price: 1 };
    if (sort === "price_high") sortOption = { price: -1 };
    if (sort === "rating") sortOption = { averageRating: -1, totalReviews: -1 };
    if (sort === "popular") sortOption = { totalSold: -1 };
    if (sort === "newest") sortOption = { createdAt: -1 };
    if (sort === "discount") sortOption = { comparePrice: -1 };

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("vendor", "firstName")
        .populate("vendorStore", "storeName")
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(filter),
    ]);

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

    let otherSellers = [];
    if (product.modelNumber && product.brand) {
      otherSellers = await Product.find({
        _id: { $ne: product._id },
        modelNumber: product.modelNumber,
        brand: product.brand,
        status: "approved",
        isActive: true,
        isDeleted: { $ne: true },
        stock: { $gt: 0 },
      })
        .select("name price comparePrice slug images vendorStore averageRating totalReviews stock shipping")
        .populate("vendorStore", "storeName storeLogo")
        .sort({ price: 1 })
        .limit(10)
        .lean();
    }

    return res.status(200).json({
      success: true,
      data: product,
      otherSellers,
    });
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
        { modelNumber: regex },
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

const getProductFilters = async (req, res) => {
  try {
    const { category, search } = req.query;

    const baseFilter = { status: "approved", isActive: true, isDeleted: { $ne: true } };

    if (category) {
      const subcategories = await Category.find({ parent: category }).select("_id");
      const categoryIds = [category, ...subcategories.map((s) => s._id)];
      baseFilter.category = { $in: categoryIds };
    }

    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escaped, "i");
      baseFilter.$or = [
        { name: regex }, { description: regex }, { brand: regex }, { tags: regex },
      ];
    }

    const [brands, colors, materials, roomTypes, priceRange, ratingCounts] = await Promise.all([
      Product.distinct("brand", { ...baseFilter, brand: { $ne: "" } }),
      Product.aggregate([
        { $match: baseFilter },
        { $unwind: "$colors" },
        { $group: { _id: "$colors.name", hex: { $first: "$colors.hex" }, count: { $sum: 1 } } },
        { $match: { _id: { $ne: null, $ne: "" } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: baseFilter },
        { $unwind: "$materials" },
        { $group: { _id: "$materials", count: { $sum: 1 } } },
        { $match: { _id: { $ne: null, $ne: "" } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: baseFilter },
        { $unwind: "$roomType" },
        { $group: { _id: "$roomType", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Product.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            min: { $min: "$price" },
            max: { $max: "$price" },
            avg: { $avg: "$price" },
          },
        },
      ]),
      Product.aggregate([
        { $match: baseFilter },
        {
          $group: {
            _id: null,
            "5plus": { $sum: { $cond: [{ $gte: ["$averageRating", 5] }, 1, 0] } },
            "4plus": { $sum: { $cond: [{ $gte: ["$averageRating", 4] }, 1, 0] } },
            "3plus": { $sum: { $cond: [{ $gte: ["$averageRating", 3] }, 1, 0] } },
            "2plus": { $sum: { $cond: [{ $gte: ["$averageRating", 2] }, 1, 0] } },
            "1plus": { $sum: { $cond: [{ $gte: ["$averageRating", 1] }, 1, 0] } },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        brands: brands.filter(Boolean).sort(),
        colors: colors.map((c) => ({ name: c._id, hex: c.hex || "", count: c.count })),
        materials: materials.map((m) => ({ name: m._id, count: m.count })),
        roomTypes: roomTypes.map((r) => ({ name: r._id, count: r.count })),
        priceRange: priceRange[0] || { min: 0, max: 10000, avg: 500 },
        ratings: ratingCounts[0] || { "5plus": 0, "4plus": 0, "3plus": 0, "2plus": 0, "1plus": 0 },
      },
    });
  } catch (err) {
    console.error("getProductFilters error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const related = await Product.find({
      _id: { $ne: id },
      category: product.category,
      status: "approved",
      isActive: true,
      isDeleted: { $ne: true },
    })
      .populate("category", "name slug")
      .populate("vendorStore", "storeName")
      .sort({ averageRating: -1, totalSold: -1 })
      .limit(8);

    return res.status(200).json({ success: true, data: related });
  } catch (err) {
    console.error("getRelatedProducts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const checkProductAvailability = async (req, res) => {
  try {
    const { name, sku, modelNumber, brand } = req.query;

    if (!name && !sku && !modelNumber) {
      return res.status(400).json({
        success: false,
        message: "Provide name, sku, or modelNumber to check",
      });
    }

    const duplicate = await checkDuplicateProduct(req.user.id, { name, sku, modelNumber });

    if (duplicate) {
      let field = "product";
      let matchType = "";
      if (name && duplicate.name.toLowerCase() === name.trim().toLowerCase()) {
        field = "name";
        matchType = "name";
      } else if (sku && duplicate.sku === sku.trim()) {
        field = "SKU";
        matchType = "sku";
      } else if (modelNumber && duplicate.modelNumber === modelNumber.trim()) {
        field = "model number";
        matchType = "modelNumber";
      }

      return res.status(200).json({
        success: true,
        available: false,
        isOwnProduct: true,
        title: "You already sell this product",
        message: `You have "${duplicate.name}" with the same ${field}.`,
        suggestion: "Edit your existing product instead of creating duplicate.",
        duplicate: {
          _id: duplicate._id,
          name: duplicate.name,
          slug: duplicate.slug,
          matchedField: field,
          matchType: matchType,
        },
      });
    }

    let competition = null;
    if (modelNumber && brand) {
      const otherSellers = await findSimilarProductsFromOtherVendors(req.user.id, {
        modelNumber,
        brand,
        name,
      });

      if (otherSellers.length > 0) {
        const prices = otherSellers.map(p => p.price).filter(p => p > 0);
        competition = {
          count: otherSellers.length,
          priceRange: prices.length > 0 ? {
            min: Math.min(...prices),
            max: Math.max(...prices),
            avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
          } : null,
          sellers: otherSellers.slice(0, 3),
        };
      }
    }

    return res.status(200).json({
      success: true,
      available: true,
      title: "You can list this product",
      message: "These details are available for a new product",
      competition,
    });
  } catch (err) {
    console.error("checkProductAvailability error:", err);
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
  getProductFilters,
  getRelatedProducts,
  checkProductAvailability,
};