const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("orders");

const createOrder = async (orderData) => {
  const orderId = uuidv4();
  const now = Date.now();

  const item = {
    orderId,
    orderNumber: orderData.orderNumber || "",
    userId: orderData.userId || orderData.user || "",
    items: (orderData.items || []).map((i) => ({
      product: i.product?.toString() || i.product || "",
      name: i.name || "",
      image: i.image || "",
      price: i.price || 0,
      quantity: i.quantity || 1,
      vendor: i.vendor?.toString() || i.vendor || "",
      storeName: i.storeName || "",
    })),
    shippingAddress: orderData.shippingAddress || {},
    paymentMethod: orderData.paymentMethod || "online",
    paymentStatus: orderData.paymentStatus || "pending",
    paymentDetails: orderData.paymentDetails || {
      gateway: "cashfree",
      cashfreeOrderId: "",
      paymentSessionId: "",
      cfPaymentId: "",
      paymentTime: null,
      paymentMode: "",
      bankReference: "",
      failureReason: "",
    },
    paymentAttempts: orderData.paymentAttempts || 0,
    lastPaymentAttemptAt: orderData.lastPaymentAttemptAt || null,
    paymentExpiresAt: orderData.paymentExpiresAt || null,
    autoCancelledAt: orderData.autoCancelledAt || null,
    country: orderData.country || {
      code: "IN",
      name: "India",
      flag: "🇮🇳",
      currency: { code: "INR", symbol: "₹", name: "Indian Rupee" },
      exchangeRate: 1,
    },
    pricing: orderData.pricing || {},
    orderStatus: orderData.orderStatus || "payment_pending",
    confirmedAt: orderData.confirmedAt || null,
    subtotal: orderData.subtotal || 0,
    discount: orderData.discount || 0,
    couponCode: orderData.couponCode || "",
    couponDiscount: orderData.couponDiscount || 0,
    couponType: orderData.couponType || "",
    shippingCharge: orderData.shippingCharge || 0,
    total: orderData.total || 0,
    notes: orderData.notes || "",
    cancelReason: orderData.cancelReason || "",
    deliveredAt: orderData.deliveredAt || null,
    cancelledAt: orderData.cancelledAt || null,
    status: orderData.orderStatus || "payment_pending",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatOrder(item);
};

const getOrderById = async (orderId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { orderId },
  }));
  if (!result.Item) return null;
  return formatOrder(result.Item);
};

const getOrderByNumber = async (orderNumber) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "orderNumber = :on",
    ExpressionAttributeValues: { ":on": orderNumber },
  }));
  if (!result.Items || result.Items.length === 0) return null;
  return formatOrder(result.Items[0]);
};

const getOrdersByCashfreeId = async (cashfreeOrderId) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "paymentDetails.cashfreeOrderId = :cfid",
    ExpressionAttributeValues: { ":cfid": cashfreeOrderId },
  }));
  if (!result.Items || result.Items.length === 0) return null;
  return formatOrder(result.Items[0]);
};

const getUserOrders = async (userId, options = {}) => {
  const params = {
    TableName: TABLE,
    IndexName: "user-orders-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    ScanIndexForward: false,
  };

  if (options.status) {
    params.FilterExpression = "#st = :status";
    params.ExpressionAttributeNames = { "#st": "orderStatus" };
    params.ExpressionAttributeValues[":status"] = options.status;
  }

  const allItems = [];
  let lastKey = null;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await docClient.send(new QueryCommand(params));
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  allItems.sort((a, b) => b.createdAt - a.createdAt);

  const total = allItems.length;
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const paginated = allItems.slice(skip, skip + limit);

  return {
    items: paginated.map(formatOrder),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

const getAllOrders = async (filters = {}) => {
  const params = { TableName: TABLE };

  const filterParts = [];
  const values = {};
  const names = {};

  if (filters.status) {
    filterParts.push("#st = :status");
    values[":status"] = filters.status;
    names["#st"] = "orderStatus";
  }

  if (filters.search) {
    filterParts.push("contains(orderNumber, :search)");
    values[":search"] = filters.search.toUpperCase();
  }

  if (filters.paymentStatus) {
    filterParts.push("paymentStatus = :ps");
    values[":ps"] = filters.paymentStatus;
  }

  if (filterParts.length > 0) {
    params.FilterExpression = filterParts.join(" AND ");
    params.ExpressionAttributeValues = values;
    if (Object.keys(names).length > 0) params.ExpressionAttributeNames = names;
  }

  const allItems = [];
  let lastKey = null;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await docClient.send(new ScanCommand(params));
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  allItems.sort((a, b) => b.createdAt - a.createdAt);

  const total = allItems.length;
  const page = filters.page || 1;
  const limit = filters.limit || 15;
  const skip = (page - 1) * limit;
  const paginated = allItems.slice(skip, skip + limit);

  return {
    items: paginated.map(formatOrder),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

const getVendorOrders = async (vendorId, options = {}) => {
  const params = {
    TableName: TABLE,
    FilterExpression: "contains(#items, :vid)",
    ExpressionAttributeNames: { "#items": "items" },
    ExpressionAttributeValues: { ":vid": vendorId },
  };

  if (options.status) {
    params.FilterExpression += " AND #st = :status";
    params.ExpressionAttributeNames["#st"] = "orderStatus";
    params.ExpressionAttributeValues[":status"] = options.status;
  }

  const allItems = [];
  let lastKey = null;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await docClient.send(new ScanCommand(params));
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  const vendorOrders = allItems.filter((order) =>
    (order.items || []).some((item) => item.vendor === vendorId)
  );

  vendorOrders.sort((a, b) => b.createdAt - a.createdAt);

  const total = vendorOrders.length;
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const paginated = vendorOrders.slice(skip, skip + limit);

  return {
    items: paginated.map((order) => {
      const formatted = formatOrder(order);
      formatted.items = formatted.items.filter((item) => item.vendor === vendorId);
      return formatted;
    }),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
};

const getExpiredPaymentOrders = async (expiryTime) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "paymentStatus = :ps AND paymentMethod = :pm AND (orderStatus = :op1 OR orderStatus = :op2) AND createdAt < :expiry AND autoCancelledAt = :notCancelled",
    ExpressionAttributeValues: {
      ":ps": "pending",
      ":pm": "online",
      ":op1": "payment_pending",
      ":op2": "confirmed",
      ":expiry": expiryTime.getTime(),
      ":notCancelled": null,
    },
  }));
  return (result.Items || []).map(formatOrder);
};

const getOrdersToAutoCancel = async (cancelTime) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "paymentStatus = :ps AND orderStatus = :os AND paymentExpiresAt < :now AND autoCancelledAt = :notCancelled",
    ExpressionAttributeValues: {
      ":ps": "expired",
      ":os": "payment_pending",
      ":now": cancelTime.toISOString(),
      ":notCancelled": null,
    },
  }));
  return (result.Items || []).map(formatOrder);
};

const updateOrder = async (orderId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  const cleanUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === "orderId" || key === "_id") continue;
    if (value instanceof Date) cleanUpdates[key] = value.toISOString();
    else cleanUpdates[key] = value;
  }

  Object.entries(cleanUpdates).forEach(([key, value]) => {
    if (key === "orderStatus" || key === "status") {
      names["#st"] = "orderStatus";
      values[":st"] = value;
      expressions.push("#st = :st");
      names["#status2"] = "status";
      values[":status2"] = value;
      expressions.push("#status2 = :status2");
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

  if (expressions.length === 0) return null;

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { orderId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatOrder(result.Attributes);
};

const getTotalRevenue = async () => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "orderStatus = :delivered",
    ExpressionAttributeValues: { ":delivered": "delivered" },
    ProjectionExpression: "#total",
    ExpressionAttributeNames: { "#total": "total" },
  }));

  return (result.Items || []).reduce((sum, order) => sum + (order.total || 0), 0);
};

const formatOrder = (item) => {
  if (!item) return null;
  return {
    _id: item.orderId,
    id: item.orderId,
    orderId: item.orderId,
    orderNumber: item.orderNumber || "",
    user: item.userId || "",
    userId: item.userId || "",
    items: (item.items || []).map((i) => ({
      product: i.product || "",
      name: i.name || "",
      image: i.image || "",
      price: i.price || 0,
      quantity: i.quantity || 1,
      vendor: i.vendor || "",
      storeName: i.storeName || "",
    })),
    shippingAddress: item.shippingAddress || {},
    paymentMethod: item.paymentMethod || "online",
    paymentStatus: item.paymentStatus || "pending",
    paymentDetails: item.paymentDetails || {},
    paymentAttempts: item.paymentAttempts || 0,
    lastPaymentAttemptAt: item.lastPaymentAttemptAt || null,
    paymentExpiresAt: item.paymentExpiresAt || null,
    autoCancelledAt: item.autoCancelledAt || null,
    country: item.country || {},
    pricing: item.pricing || {},
    orderStatus: item.orderStatus || "payment_pending",
    confirmedAt: item.confirmedAt || null,
    subtotal: item.subtotal || 0,
    discount: item.discount || 0,
    couponCode: item.couponCode || "",
    couponDiscount: item.couponDiscount || 0,
    couponType: item.couponType || "",
    shippingCharge: item.shippingCharge || 0,
    total: item.total || 0,
    notes: item.notes || "",
    cancelReason: item.cancelReason || "",
    deliveredAt: item.deliveredAt || null,
    cancelledAt: item.cancelledAt || null,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  createOrder,
  getOrderById,
  getOrderByNumber,
  getOrdersByCashfreeId,
  getUserOrders,
  getAllOrders,
  getVendorOrders,
  getExpiredPaymentOrders,
  getOrdersToAutoCancel,
  updateOrder,
  getTotalRevenue,
  formatOrder,
};