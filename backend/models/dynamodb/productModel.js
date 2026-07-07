const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("products");

const createProduct = async (productData) => {
  const productId = uuidv4();
  const now = Date.now();

  const item = {
    productId,
    name: productData.name || "",
    slug: productData.slug || "",
    description: productData.description || "",
    shortDescription: productData.shortDescription || "",
    keyFeatures: productData.keyFeatures || [],
    category: productData.category?._id || productData.category || "",
    brand: productData.brand || "",
    modelNumber: productData.modelNumber || "",
    price: productData.price || 0,
    basePrice: productData.basePrice || productData.price || 0,
    baseCurrency: productData.baseCurrency || "INR",
    comparePrice: productData.comparePrice || 0,
    costPrice: productData.costPrice || 0,
    bulkPricing: productData.bulkPricing || [],
    countryPricing: productData.countryPricing || [],
    availableCountries: productData.availableCountries || [],
    restrictedCountries: productData.restrictedCountries || [],
    shippingCountries: productData.shippingCountries || [],
    images: productData.images || [],
    videoUrl: productData.videoUrl || "",
    model3dUrl: productData.model3dUrl || "",
    colors: productData.colors || [],
    sizes: productData.sizes || [],
    materials: productData.materials || [],
    variants: productData.variants || [],
    specifications: productData.specifications || [],
    stock: productData.stock || 0,
    lowStockThreshold: productData.lowStockThreshold || 5,
    reservedStock: productData.reservedStock || 0,
    sku: productData.sku || "",
    barcode: productData.barcode || "",
    weight: productData.weight || 0,
    weightUnit: productData.weightUnit || "kg",
    dimensions: productData.dimensions || { length: 0, width: 0, height: 0, unit: "cm" },
    roomType: productData.roomType || [],
    assemblyRequired: productData.assemblyRequired || false,
    assemblyTime: productData.assemblyTime || 0,
    warranty: productData.warranty || { duration: 0, unit: "months", type: "none", description: "" },
    returnPolicy: productData.returnPolicy || { returnable: true, returnWindow: 10, returnConditions: "" },
    shipping: productData.shipping || { isFreeShipping: false, shippingCost: 0, handlingTime: 1, estimatedDeliveryDays: 5 },
    faqs: productData.faqs || [],
    seo: productData.seo || { metaTitle: "", metaDescription: "", keywords: [] },
    tags: productData.tags || [],
    vendorId: productData.vendorId || productData.vendor || "",
    vendorStoreId: productData.vendorStoreId || productData.vendorStore || "",
    status: productData.status || "pending",
    rejectionReason: productData.rejectionReason || "",
    isFeatured: productData.isFeatured || false,
    isBestSeller: productData.isBestSeller || false,
    isNewArrival: productData.isNewArrival || false,
    isActive: productData.isActive !== false,
    averageRating: productData.averageRating || 0,
    totalReviews: productData.totalReviews || 0,
    ratingDistribution: productData.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    totalSold: productData.totalSold || 0,
    views: productData.views || 0,
    wishlistCount: productData.wishlistCount || 0,
    isDeleted: productData.isDeleted || false,
    delistReason: productData.delistReason || "",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatProduct(item);
};

const getProductById = async (productId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { productId },
  }));
  if (!result.Item) return null;
  return formatProduct(result.Item);
};

const getProductBySlug = async (slug) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "slug-index",
    KeyConditionExpression: "slug = :slug",
    ExpressionAttributeValues: { ":slug": slug },
  }));
  if (!result.Items || result.Items.length === 0) return null;
  return formatProduct(result.Items[0]);
};

const getProductsByVendor = async (vendorId, options = {}) => {
  const params = {
    TableName: TABLE,
    IndexName: "vendor-index",
    KeyConditionExpression: "vendorId = :vid",
    ExpressionAttributeValues: { ":vid": vendorId },
    ScanIndexForward: false,
  };

  const filterParts = [];
  if (options.status) {
    filterParts.push("#st = :status");
    params.ExpressionAttributeValues[":status"] = options.status;
    params.ExpressionAttributeNames = { ...(params.ExpressionAttributeNames || {}), "#st": "status" };
  }

  filterParts.push("isDeleted = :notDeleted");
  params.ExpressionAttributeValues[":notDeleted"] = false;

  if (filterParts.length > 0) {
    params.FilterExpression = filterParts.join(" AND ");
  }

  if (options.limit) params.Limit = options.limit;

  const result = await docClient.send(new QueryCommand(params));
  return {
    items: (result.Items || []).map(formatProduct),
    count: result.Count || 0,
    lastKey: result.LastEvaluatedKey || null,
  };
};

const getProductsByCategory = async (categoryId, options = {}) => {
  const params = {
    TableName: TABLE,
    IndexName: "category-index",
    KeyConditionExpression: "category = :cat",
    ExpressionAttributeValues: { ":cat": categoryId },
    ScanIndexForward: false,
  };

  const filterParts = ["isDeleted = :notDeleted", "isActive = :active"];
  params.ExpressionAttributeValues[":notDeleted"] = false;
  params.ExpressionAttributeValues[":active"] = true;

  if (options.status) {
    filterParts.push("#st = :status");
    params.ExpressionAttributeValues[":status"] = options.status;
    params.ExpressionAttributeNames = { "#st": "status" };
  }

  params.FilterExpression = filterParts.join(" AND ");
  if (options.limit) params.Limit = options.limit;

  const result = await docClient.send(new QueryCommand(params));
  return (result.Items || []).map(formatProduct);
};

const getAllProducts = async (filters = {}) => {
  const params = { TableName: TABLE };

  const filterParts = [];
  const values = {};
  const names = {};

  filterParts.push("isDeleted = :notDeleted");
  values[":notDeleted"] = false;

  if (filters.status) {
    filterParts.push("#st = :status");
    values[":status"] = filters.status;
    names["#st"] = "status";
  }

  if (filters.isActive !== undefined) {
    filterParts.push("isActive = :active");
    values[":active"] = filters.isActive;
  }

  if (filters.vendorId) {
    filterParts.push("vendorId = :vid");
    values[":vid"] = filters.vendorId;
  }

  if (filters.category) {
    filterParts.push("category = :cat");
    values[":cat"] = filters.category;
  }

  if (filters.brand) {
    filterParts.push("brand = :brand");
    values[":brand"] = filters.brand;
  }

  if (filters.isFeatured) {
    filterParts.push("isFeatured = :featured");
    values[":featured"] = true;
  }

  if (filters.minPrice !== undefined) {
    filterParts.push("price >= :minP");
    values[":minP"] = Number(filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    filterParts.push("price <= :maxP");
    values[":maxP"] = Number(filters.maxPrice);
  }

  if (filters.minRating !== undefined) {
    filterParts.push("averageRating >= :minR");
    values[":minR"] = Number(filters.minRating);
  }

  if (filters.inStock) {
    filterParts.push("stock > :zero");
    values[":zero"] = 0;
  }

  params.FilterExpression = filterParts.join(" AND ");
  params.ExpressionAttributeValues = values;
  if (Object.keys(names).length > 0) params.ExpressionAttributeNames = names;

  const allItems = [];
  let lastKey = null;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await docClient.send(new ScanCommand(params));
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  let products = allItems.map(formatProduct);

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    products = products.filter((p) =>
      p.name.toLowerCase().includes(searchLower) ||
      p.description.toLowerCase().includes(searchLower) ||
      p.brand.toLowerCase().includes(searchLower) ||
      p.modelNumber.toLowerCase().includes(searchLower) ||
      (p.tags || []).some((t) => String(t).toLowerCase().includes(searchLower)) ||
      (p.keyFeatures || []).some((f) => String(f).toLowerCase().includes(searchLower))
    );
  }

  if (filters.brands) {
    const brandArr = String(filters.brands).split(",").filter(Boolean);
    if (brandArr.length) products = products.filter((p) => brandArr.includes(p.brand));
  }

  if (filters.colors) {
    const colorArr = String(filters.colors).split(",").filter(Boolean);
    if (colorArr.length) products = products.filter((p) =>
      (p.colors || []).some((c) => colorArr.includes(c.name))
    );
  }

  if (filters.sizes) {
    const sizeArr = String(filters.sizes).split(",").filter(Boolean);
    if (sizeArr.length) products = products.filter((p) =>
      (p.sizes || []).some((s) => sizeArr.includes(s.name))
    );
  }

  if (filters.materials) {
    const matArr = String(filters.materials).split(",").filter(Boolean);
    if (matArr.length) products = products.filter((p) =>
      (p.materials || []).some((m) => matArr.includes(m))
    );
  }

  if (filters.roomType) {
    const roomArr = String(filters.roomType).split(",").filter(Boolean);
    if (roomArr.length) products = products.filter((p) =>
      (p.roomType || []).some((r) => roomArr.includes(r))
    );
  }

  if (filters.hasDiscount) {
    products = products.filter((p) => p.comparePrice > p.price);
  }

  if (filters.freeShipping) {
    products = products.filter((p) => p.shipping?.isFreeShipping);
  }

  if (filters.categoryIds) {
    const categoryIds = Array.isArray(filters.categoryIds) ? filters.categoryIds.map(String) : [];
    products = products.filter((p) => categoryIds.includes(String(p.category?._id || p.category || "")));
  }

  const sortMap = {
    price_low: (a, b) => a.price - b.price,
    price_high: (a, b) => b.price - a.price,
    rating: (a, b) => b.averageRating - a.averageRating || b.totalReviews - a.totalReviews,
    popular: (a, b) => b.totalSold - a.totalSold,
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    discount: (a, b) => (b.comparePrice - b.price) - (a.comparePrice - a.price),
  };

  const sortFn = sortMap[filters.sort] || sortMap.newest;
  products.sort(sortFn);

  const total = products.length;
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 12;
  const skip = (page - 1) * limit;
  const paginated = products.slice(skip, skip + limit);

  return {
    items: paginated,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

const updateProduct = async (productId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};
  const finalUpdates = { ...updates };

  if (finalUpdates.category !== undefined) {
    finalUpdates.category = finalUpdates.category?._id || finalUpdates.category || "";
  }

  Object.entries(finalUpdates).forEach(([key, value]) => {
    if (key === "productId" || key === "_id") return;
    if (key === "status") {
      names["#st"] = "status";
      values[":st"] = value;
      expressions.push("#st = :st");
      return;
    }
    const attrName = `#${key}`;
    const attrValue = `:${key}`;
    names[attrName] = key;
    values[attrValue] = value;
    expressions.push(`${attrName} = ${attrValue}`);
  });

  values[":updatedAt"] = Date.now();
  names["#updatedAt"] = "updatedAt";
  expressions.push("#updatedAt = :updatedAt");

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { productId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatProduct(result.Attributes);
};

const incrementProductField = async (productId, field, amount = 1) => {
  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { productId },
    UpdateExpression: `SET #field = if_not_exists(#field, :zero) + :amt, #updatedAt = :now`,
    ExpressionAttributeNames: { "#field": field, "#updatedAt": "updatedAt" },
    ExpressionAttributeValues: { ":amt": amount, ":zero": 0, ":now": Date.now() },
    ReturnValues: "ALL_NEW",
  }));
  return formatProduct(result.Attributes);
};

const checkDuplicateProduct = async (vendorId, { name, sku, modelNumber }, excludeProductId = null) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "vendorId = :vid AND isDeleted = :notDeleted",
    ExpressionAttributeValues: { ":vid": vendorId, ":notDeleted": false },
  }));

  if (!result.Items) return null;

  const products = result.Items.filter((p) => !excludeProductId || p.productId !== excludeProductId);

  for (const p of products) {
    if (name && String(p.name || "").toLowerCase() === name.trim().toLowerCase()) {
      return formatProduct(p);
    }
    if (sku && sku.trim() && p.sku === sku.trim()) {
      return formatProduct(p);
    }
    if (modelNumber && modelNumber.trim() && p.modelNumber === modelNumber.trim()) {
      return formatProduct(p);
    }
  }

  return null;
};

const findSimilarProducts = async (vendorId, { modelNumber, brand }) => {
  if (!modelNumber || !brand) return [];

  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "modelNumber = :mn AND brand = :br AND vendorId <> :vid AND #st = :approved AND isActive = :active AND isDeleted = :notDeleted",
    ExpressionAttributeNames: { "#st": "status" },
    ExpressionAttributeValues: {
      ":mn": modelNumber.trim(),
      ":br": brand.trim(),
      ":vid": vendorId,
      ":approved": "approved",
      ":active": true,
      ":notDeleted": false,
    },
  }));

  return (result.Items || []).slice(0, 5).map(formatProduct);
};

const checkSlugExists = async (slug, excludeId = null) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "slug-index",
    KeyConditionExpression: "slug = :slug",
    ExpressionAttributeValues: { ":slug": slug },
  }));

  if (!result.Items || result.Items.length === 0) return false;
  if (excludeId && result.Items[0].productId === excludeId) return false;
  return true;
};

const generateUniqueSlug = async (name, vendorStoreName, excludeId = null) => {
  const baseSlug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  let slug = baseSlug;
  if (!(await checkSlugExists(slug, excludeId))) return slug;

  if (vendorStoreName) {
    const vendorPart = vendorStoreName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 20);
    slug = `${baseSlug}-${vendorPart}`;
    if (!(await checkSlugExists(slug, excludeId))) return slug;
  }

  slug = `${baseSlug}-${Date.now()}`;
  return slug;
};

const getProductFilters = async (filters = {}) => {
  const result = await getAllProducts({
    status: "approved",
    isActive: true,
    category: filters.category,
    search: filters.search,
    limit: 10000,
    page: 1,
  });

  const products = result.items;

  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))].sort();

  const colorMap = {};
  products.forEach((p) => {
    (p.colors || []).forEach((c) => {
      if (c.name) {
        if (!colorMap[c.name]) colorMap[c.name] = { name: c.name, hex: c.hex || "", count: 0 };
        colorMap[c.name].count++;
      }
    });
  });

  const materialMap = {};
  products.forEach((p) => {
    (p.materials || []).forEach((m) => {
      if (m) {
        if (!materialMap[m]) materialMap[m] = { name: m, count: 0 };
        materialMap[m].count++;
      }
    });
  });

  const roomMap = {};
  products.forEach((p) => {
    (p.roomType || []).forEach((r) => {
      if (r) {
        if (!roomMap[r]) roomMap[r] = { name: r, count: 0 };
        roomMap[r].count++;
      }
    });
  });

  const prices = products.map((p) => p.price).filter((p) => p > 0);

  const ratingCounts = { "5plus": 0, "4plus": 0, "3plus": 0, "2plus": 0, "1plus": 0 };
  products.forEach((p) => {
    if (p.averageRating >= 5) ratingCounts["5plus"]++;
    if (p.averageRating >= 4) ratingCounts["4plus"]++;
    if (p.averageRating >= 3) ratingCounts["3plus"]++;
    if (p.averageRating >= 2) ratingCounts["2plus"]++;
    if (p.averageRating >= 1) ratingCounts["1plus"]++;
  });

  return {
    brands,
    colors: Object.values(colorMap),
    materials: Object.values(materialMap),
    roomTypes: Object.values(roomMap),
    priceRange: prices.length > 0 ? {
      min: Math.min(...prices),
      max: Math.max(...prices),
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
    } : { min: 0, max: 10000, avg: 500 },
    ratings: ratingCounts,
  };
};

const countProductsByVendor = async (vendorId, filters = {}) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "vendorId = :vid AND isDeleted = :notDeleted" +
      (filters.status ? " AND #st = :status" : "") +
      (filters.stock !== undefined ? " AND stock = :stock" : ""),
    ExpressionAttributeValues: {
      ":vid": vendorId,
      ":notDeleted": false,
      ...(filters.status ? { ":status": filters.status } : {}),
      ...(filters.stock !== undefined ? { ":stock": filters.stock } : {}),
    },
    ...(filters.status ? { ExpressionAttributeNames: { "#st": "status" } } : {}),
    Select: "COUNT",
  }));

  return result.Count || 0;
};

const formatProduct = (item) => {
  if (!item) return null;

  const product = {
    _id: item.productId,
    id: item.productId,
    productId: item.productId,
    name: item.name || "",
    slug: item.slug || "",
    description: item.description || "",
    shortDescription: item.shortDescription || "",
    keyFeatures: item.keyFeatures || [],
    category: item.category ? { _id: String(item.category), name: item.categoryName || "" } : null,
    brand: item.brand || "",
    modelNumber: item.modelNumber || "",
    price: Number(item.price) || 0,
    basePrice: Number(item.basePrice || item.price) || 0,
    baseCurrency: item.baseCurrency || "INR",
    comparePrice: Number(item.comparePrice) || 0,
    costPrice: Number(item.costPrice) || 0,
    bulkPricing: item.bulkPricing || [],
    images: item.images || [],
    videoUrl: item.videoUrl || "",
    model3dUrl: item.model3dUrl || "",
    colors: item.colors || [],
    sizes: item.sizes || [],
    materials: item.materials || [],
    variants: item.variants || [],
    specifications: item.specifications || [],
    stock: Number(item.stock) || 0,
    lowStockThreshold: Number(item.lowStockThreshold) || 5,
    reservedStock: Number(item.reservedStock) || 0,
    sku: item.sku || "",
    barcode: item.barcode || "",
    weight: Number(item.weight) || 0,
    weightUnit: item.weightUnit || "kg",
    dimensions: item.dimensions || { length: 0, width: 0, height: 0, unit: "cm" },
    roomType: item.roomType || [],
    assemblyRequired: item.assemblyRequired || false,
    assemblyTime: item.assemblyTime || 0,
    warranty: item.warranty || {},
    returnPolicy: item.returnPolicy || {},
    shipping: item.shipping || {},
    faqs: item.faqs || [],
    seo: item.seo || {},
    tags: item.tags || [],
    vendor: item.vendorId || "",
    vendorStore: item.vendorStoreId || "",
    vendorId: item.vendorId || "",
    vendorStoreId: item.vendorStoreId || "",
    status: item.status || "pending",
    rejectionReason: item.rejectionReason || "",
    isFeatured: item.isFeatured || false,
    isBestSeller: item.isBestSeller || false,
    isNewArrival: item.isNewArrival || false,
    isActive: item.isActive !== false,
    averageRating: Number(item.averageRating) || 0,
    totalReviews: Number(item.totalReviews) || 0,
    ratingDistribution: item.ratingDistribution || {},
    totalSold: Number(item.totalSold) || 0,
    views: Number(item.views) || 0,
    wishlistCount: Number(item.wishlistCount) || 0,
    isDeleted: item.isDeleted || false,
    delistReason: item.delistReason || "",
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };

  if (product.comparePrice > product.price) {
    product.discountPercentage = Math.round(
      ((product.comparePrice - product.price) / product.comparePrice) * 100
    );
  } else {
    product.discountPercentage = 0;
  }

  product.availableStock = Math.max(0, product.stock - product.reservedStock);

  return product;
};

module.exports = {
  createProduct,
  getProductById,
  getProductBySlug,
  getProductsByVendor,
  getProductsByCategory,
  getAllProducts,
  updateProduct,
  incrementProductField,
  checkDuplicateProduct,
  findSimilarProducts,
  checkSlugExists,
  generateUniqueSlug,
  getProductFilters,
  countProductsByVendor,
  formatProduct,
};