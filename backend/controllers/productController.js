const {
  createProduct: createProductInDB,
  getProductById,
  getProductBySlug,
  getProductsByVendor,
  getAllProducts: getAllProductsFromDB,
  updateProduct: updateProductInDB,
  incrementProductField,
  checkDuplicateProduct,
  findSimilarProducts,
  generateUniqueSlug,
  getProductFilters: getProductFiltersFromDB,
  countProductsByVendor,
} = require("../models/dynamodb/productModel");
const { getVendorByUserId } = require("../models/dynamodb/vendorModel");
const { getCategoryById, getCategoriesByParent } = require("../models/dynamodb/categoryModel");

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

    let categoryData = null;
    try {
      categoryData = await getCategoryById(category);
    } catch (e) {}

    if (!categoryData) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    const vendor = await getVendorByUserId(req.user.id);
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
        suggestion: "Update your existing product instead of creating a duplicate.",
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

    const similarProducts = await findSimilarProducts(req.user.id, { modelNumber, brand });

    const slug = await generateUniqueSlug(name, vendor.storeName);

    const product = await createProductInDB({
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
      vendorId: req.user.id,
      vendorStoreId: vendor._id,
      status: "approved",
      isActive: true,
    });

    let priceRange = null;
    if (similarProducts.length > 0) {
      const prices = similarProducts.map((p) => p.price).filter((p) => p > 0);
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
    const status = req.query.status;

    const result = await getProductsByVendor(req.user.id, { status, limit: 100 });

    const total = result.items.length;
    const skip = (page - 1) * limit;
    const paginated = result.items.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      data: paginated,
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
    const product = await getProductById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.vendorId !== req.user.id) {
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
      const vendor = await getVendorByUserId(req.user.id);
      updateData.slug = await generateUniqueSlug(updateData.name, vendor?.storeName, id);
    }

    if (updateData.description) updateData.description = updateData.description.trim();
    if (updateData.brand) updateData.brand = updateData.brand.trim();
    if (updateData.modelNumber) updateData.modelNumber = updateData.modelNumber.trim();
    if (updateData.sku) updateData.sku = updateData.sku.trim();
    if (updateData.barcode) updateData.barcode = updateData.barcode.trim();

    if (updateData.category) {
      let catExists = null;
      try {
        catExists = await getCategoryById(updateData.category);
      } catch (e) {}
      if (!catExists) return res.status(404).json({ success: false, message: "Category not found" });
    }

    if (updateData.price !== undefined) {
      updateData.basePrice = updateData.price;
    }

    const updated = await updateProductInDB(id, updateData);

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
    const product = await getProductById(id);

    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    if (product.vendorId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await updateProductInDB(id, { isDeleted: true, isActive: false });

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

    const {
      category, brand, brands, minPrice, maxPrice,
      colors, sizes, materials, roomType,
      minRating, inStock, hasDiscount, isFeatured, isNewArrival,
      assemblyRequired, freeShipping,
      sort, search, filterType,
    } = req.query;

    const filters = {
      status: "approved",
      isActive: true,
      page,
      limit,
      sort: sort || "newest",
      search,
      brand,
      brands,
      minPrice,
      maxPrice,
      colors,
      sizes,
      materials,
      roomType,
      minRating,
      inStock: inStock === "true",
      hasDiscount: hasDiscount === "true",
      freeShipping: freeShipping === "true",
    };

    if (isFeatured === "true") filters.isFeatured = true;

    if (filterType === "featured") filters.isFeatured = true;
    if (filterType === "topRated") { filters.minRating = 4; filters.sort = "rating"; }
    if (filterType === "bestSeller") filters.sort = "popular";
    if (filterType === "discount") { filters.hasDiscount = true; filters.sort = "discount"; }
    if (filterType === "newArrival" || filterType === "latest") filters.sort = "newest";

    if (category) {
      try {
        const subcategories = await getCategoriesByParent(category);
        const categoryIds = [category, ...subcategories.map((s) => s._id)];
        filters.categoryIds = categoryIds;
      } catch (e) {
        filters.category = category;
      }
    }

    const result = await getAllProductsFromDB(filters);

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (err) {
    console.error("getAllProducts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getSingleProduct = async (req, res) => {
  try {
    const { slug } = req.params;
    const product = await getProductBySlug(slug);

    if (!product || product.isDeleted) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    await incrementProductField(product._id, "views", 1);

    let otherSellers = [];
    if (product.modelNumber && product.brand) {
      otherSellers = await findSimilarProducts("_none_", {
        modelNumber: product.modelNumber,
        brand: product.brand,
      });

      otherSellers = otherSellers.filter(
        (s) => s._id !== product._id && s.stock > 0
      );
    }

    let vendorData = null;
    try {
      const { getVendorById } = require("../models/dynamodb/vendorModel");
      vendorData = await getVendorById(product.vendorStoreId);
    } catch (e) {}

    if (vendorData) {
      product.vendorStore = {
        _id: vendorData._id,
        storeName: vendorData.storeName,
        storeLogo: vendorData.storeLogo,
      };
    }

    let categoryData = null;
    try {
      categoryData = await getCategoryById(product.category?._id || product.category);
    } catch (e) {}

    if (categoryData) {
      product.category = {
        _id: categoryData._id,
        name: categoryData.name,
        slug: categoryData.slug,
      };
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
    const { status, search, vendor } = req.query;

    const filters = { page, limit, search };

    if (status) filters.status = status;
    if (vendor) filters.vendorId = vendor;

    const result = await getAllProductsFromDB(filters);

    return res.status(200).json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        pages: result.pages,
      },
    });
  } catch (err) {
    console.error("adminGetAllProducts error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const featureProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await updateProductInDB(id, { isFeatured: !product.isFeatured });

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
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await updateProductInDB(id, {
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
    const product = await getProductById(id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    await updateProductInDB(id, {
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

    const allProducts = await getProductsByVendor(vendorId, { limit: 1000 });
    const products = allProducts.items;

    const totalProducts = products.length;
    const approvedProducts = products.filter((p) => p.status === "approved").length;
    const outOfStockProducts = products.filter((p) => p.status === "approved" && p.stock === 0).length;
    const lowStockProducts = products.filter(
      (p) => p.status === "approved" && p.stock > 0 && p.stock <= (p.lowStockThreshold || 5)
    ).length;

    const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
    const { docClient, getTableName } = require("../config/dynamodb");

    const orderResult = await docClient.send(new ScanCommand({
      TableName: getTableName("orders"),
      FilterExpression: "contains(#items, :vid)",
      ExpressionAttributeNames: { "#items": "items" },
      ExpressionAttributeValues: { ":vid": vendorId },
    }));

    const allVendorOrders = (orderResult.Items || []).filter((order) =>
      (order.items || []).some((item) => item.vendor === vendorId)
    );

    const now = new Date();
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const orderCounts = {
      total: allVendorOrders.length,
      confirmed: 0, processing: 0, shipped: 0,
      out_for_delivery: 0, delivered: 0, cancelled: 0,
      last7Days: 0, last30Days: 0,
    };

    allVendorOrders.forEach((order) => {
      const status = order.orderStatus || order.status;
      if (status in orderCounts) orderCounts[status]++;
      const createdAt = new Date(order.createdAt);
      if (createdAt >= last7Days) orderCounts.last7Days++;
      if (createdAt >= last30Days) orderCounts.last30Days++;
    });

    const getVendorRevenue = (order) => {
      return (order.items || [])
        .filter((item) => item.vendor === vendorId)
        .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0);
    };

    const deliveredOrders = allVendorOrders.filter((o) =>
      (o.orderStatus || o.status) === "delivered"
    );

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

    const monthlyGrowth = lastMonthRevenue > 0
      ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
      : thisMonthRevenue > 0 ? 100 : 0;

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

    const topProducts = products
      .filter((p) => p.status === "approved" && p.totalSold > 0)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 5)
      .map((p) => ({
        _id: p._id,
        name: p.name,
        price: p.price,
        images: p.images,
        averageRating: p.averageRating,
        totalSold: p.totalSold,
      }));

    const vendorProfile = await getVendorByUserId(vendorId);

    return res.status(200).json({
      success: true,
      data: {
        revenue: {
          total: totalRevenue,
          thisMonth: thisMonthRevenue,
          lastMonth: lastMonthRevenue,
          monthlyGrowth,
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

    const filters = await getProductFiltersFromDB({ category, search });

    return res.status(200).json({
      success: true,
      data: filters,
    });
  } catch (err) {
    console.error("getProductFilters error:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

const getRelatedProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const categoryId = product.category?._id || product.category;

    const result = await getAllProductsFromDB({
      status: "approved",
      isActive: true,
      category: categoryId,
      limit: 100,
      page: 1,
      sort: "rating",
    });

    const related = result.items
      .filter((p) => p._id !== id)
      .slice(0, 8);

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
      const otherSellers = await findSimilarProducts(req.user.id, { modelNumber, brand });

      if (otherSellers.length > 0) {
        const prices = otherSellers.map((p) => p.price).filter((p) => p > 0);
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