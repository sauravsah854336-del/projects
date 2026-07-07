const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, UpdateCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("coupons");

const createCoupon = async (couponData) => {
  const now = Date.now();

  const item = {
    code: couponData.code.toUpperCase().trim(),
    couponId: uuidv4(),
    description: couponData.description || "",
    discountType: couponData.discountType || "percentage",
    discountValue: couponData.discountValue || 0,
    maxDiscountAmount: couponData.maxDiscountAmount || null,
    minOrderAmount: couponData.minOrderAmount || 0,
    startDate: couponData.startDate ? new Date(couponData.startDate).toISOString() : new Date().toISOString(),
    expiryDate: couponData.expiryDate ? new Date(couponData.expiryDate).toISOString() : null,
    usageLimit: couponData.usageLimit || null,
    usageLimitPerUser: couponData.usageLimitPerUser || 1,
    usedCount: 0,
    usedBy: [],
    applicableCategories: couponData.applicableCategories || [],
    applicableProducts: couponData.applicableProducts || [],
    applicableCountries: couponData.applicableCountries || [],
    firstTimeUserOnly: couponData.firstTimeUserOnly || false,
    isActive: couponData.isActive !== false,
    isPublic: couponData.isPublic !== false,
    createdBy: couponData.createdBy || "",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatCoupon(item);
};

const getCouponByCode = async (code) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { code: code.toUpperCase().trim() },
  }));
  if (!result.Item) return null;
  return formatCoupon(result.Item);
};

const getCouponById = async (couponId) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "couponId = :cid",
    ExpressionAttributeValues: { ":cid": couponId },
  }));
  if (!result.Items || result.Items.length === 0) return null;
  return formatCoupon(result.Items[0]);
};

const getAllCoupons = async (filters = {}) => {
  const params = { TableName: TABLE };

  const allItems = [];
  let lastKey = null;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await docClient.send(new ScanCommand(params));
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  let coupons = allItems.map(formatCoupon);
  const now = new Date();

  if (filters.status === "active") {
    coupons = coupons.filter((c) => c.isActive && new Date(c.expiryDate) > now);
  } else if (filters.status === "expired") {
    coupons = coupons.filter((c) => new Date(c.expiryDate) <= now);
  } else if (filters.status === "inactive") {
    coupons = coupons.filter((c) => !c.isActive);
  }

  if (filters.type) {
    coupons = coupons.filter((c) => c.discountType === filters.type);
  }

  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    coupons = coupons.filter((c) =>
      c.code.toLowerCase().includes(searchLower) ||
      c.description.toLowerCase().includes(searchLower)
    );
  }

  coupons.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const totalCoupons = allItems.length;
  const activeCoupons = allItems.filter((c) => c.isActive && new Date(c.expiryDate) > now).length;
  const totalUsage = allItems.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  const total = coupons.length;
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const paginated = coupons.slice(skip, skip + limit);

  return {
    items: paginated,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    stats: { totalCoupons, activeCoupons, totalUsage },
  };
};

const getPublicCoupons = async (countryCode) => {
  const now = new Date();

  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "isActive = :active AND isPublic = :pub",
    ExpressionAttributeValues: { ":active": true, ":pub": true },
  }));

  let coupons = (result.Items || [])
    .map(formatCoupon)
    .filter((c) => {
      const start = new Date(c.startDate || 0);
      const expiry = new Date(c.expiryDate);
      return start <= now && expiry > now;
    });

  if (countryCode) {
    coupons = coupons.filter((c) =>
      !c.applicableCountries?.length ||
      c.applicableCountries.includes(countryCode.toUpperCase())
    );
  }

  return coupons.slice(0, 20).map((c) => ({
    _id: c._id,
    code: c.code,
    description: c.description,
    discountType: c.discountType,
    discountValue: c.discountValue,
    maxDiscountAmount: c.maxDiscountAmount,
    minOrderAmount: c.minOrderAmount,
    expiryDate: c.expiryDate,
    firstTimeUserOnly: c.firstTimeUserOnly,
  }));
};

const updateCoupon = async (code, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key === "code" || key === "_id") return;
    const attrName = `#${key}`;
    const attrValue = `:${key}`;
    names[attrName] = key;
    values[attrValue] = value;
    expressions.push(`${attrName} = ${attrValue}`);
  });

  values[":updatedAt"] = Date.now();
  names["#updatedAt"] = "updatedAt";
  expressions.push("#updatedAt = :updatedAt");

  if (expressions.length === 0) return null;

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { code },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatCoupon(result.Attributes);
};

const saveCoupon = async (coupon) => {
  const item = { ...coupon };
  if (item._id) delete item._id;
  if (item.id) delete item.id;
  item.updatedAt = Date.now();

  if (item.startDate instanceof Date) item.startDate = item.startDate.toISOString();
  if (item.expiryDate instanceof Date) item.expiryDate = item.expiryDate.toISOString();

  if (item.usedBy) {
    item.usedBy = item.usedBy.map((u) => ({
      ...u,
      lastUsedAt: u.lastUsedAt instanceof Date ? u.lastUsedAt.toISOString() : (u.lastUsedAt || new Date().toISOString()),
    }));
  }

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatCoupon(item);
};

const deleteCoupon = async (code) => {
  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { code },
  }));
};

const deleteCouponById = async (couponId) => {
  const coupon = await getCouponById(couponId);
  if (!coupon) return false;
  await deleteCoupon(coupon.code);
  return true;
};

const isValid = (coupon) => {
  const now = new Date();
  if (!coupon.isActive) return { valid: false, reason: "Coupon is inactive" };
  if (new Date(coupon.startDate) > now) return { valid: false, reason: "Coupon not yet active" };
  if (new Date(coupon.expiryDate) <= now) return { valid: false, reason: "Coupon has expired" };
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, reason: "Coupon usage limit reached" };
  }
  return { valid: true };
};

const canBeUsedBy = (coupon, userId) => {
  const userUsage = (coupon.usedBy || []).find(
    (u) => (u.user || u) === userId
  );

  if (!userUsage) return { canUse: true, usedCount: 0 };

  const perUserLimit = coupon.usageLimitPerUser || 1;
  if ((userUsage.usedCount || 1) >= perUserLimit) {
    return {
      canUse: false,
      reason: `You have already used this coupon ${userUsage.usedCount || 1} time(s)`,
      usedCount: userUsage.usedCount || 1,
    };
  }

  return { canUse: true, usedCount: userUsage.usedCount || 0 };
};

const calculateDiscount = (coupon, subtotal) => {
  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = (subtotal * coupon.discountValue) / 100;
    if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
      discount = coupon.maxDiscountAmount;
    }
  } else if (coupon.discountType === "fixed") {
    discount = Math.min(coupon.discountValue, subtotal);
  }

  return Math.round(discount * 100) / 100;
};

const formatCoupon = (item) => {
  if (!item) return null;
  return {
    _id: item.couponId || item.code,
    id: item.couponId || item.code,
    couponId: item.couponId || "",
    code: item.code || "",
    description: item.description || "",
    discountType: item.discountType || "percentage",
    discountValue: item.discountValue || 0,
    maxDiscountAmount: item.maxDiscountAmount || null,
    minOrderAmount: item.minOrderAmount || 0,
    startDate: item.startDate || null,
    expiryDate: item.expiryDate || null,
    usageLimit: item.usageLimit || null,
    usageLimitPerUser: item.usageLimitPerUser || 1,
    usedCount: item.usedCount || 0,
    usedBy: item.usedBy || [],
    applicableCategories: item.applicableCategories || [],
    applicableProducts: item.applicableProducts || [],
    applicableCountries: item.applicableCountries || [],
    firstTimeUserOnly: item.firstTimeUserOnly || false,
    isActive: item.isActive !== false,
    isPublic: item.isPublic !== false,
    createdBy: item.createdBy || "",
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  createCoupon,
  getCouponByCode,
  getCouponById,
  getAllCoupons,
  getPublicCoupons,
  updateCoupon,
  saveCoupon,
  deleteCoupon,
  deleteCouponById,
  isValid,
  canBeUsedBy,
  calculateDiscount,
  formatCoupon,
};