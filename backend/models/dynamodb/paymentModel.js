const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("payments");

const createPayment = async (paymentData) => {
  const paymentId = uuidv4();
  const now = Date.now();

  const item = {
    paymentId,
    orderId: paymentData.orderId || paymentData.order || "",
    userId: paymentData.userId || paymentData.user || "",
    orderNumber: paymentData.orderNumber || "",
    amount: paymentData.amount || 0,
    currency: paymentData.currency || "INR",
    gateway: paymentData.gateway || "cashfree",
    gatewayOrderId: paymentData.gatewayOrderId || "",
    paymentSessionId: paymentData.paymentSessionId || "",
    gatewayPaymentId: paymentData.gatewayPaymentId || "",
    paymentMethod: paymentData.paymentMethod || "",
    paymentGroup: paymentData.paymentGroup || "",
    status: paymentData.status || "initiated",
    bankReference: paymentData.bankReference || "",
    upiId: paymentData.upiId || "",
    cardDetails: paymentData.cardDetails || { last4: "", network: "", type: "", issuer: "" },
    customerDetails: paymentData.customerDetails || { name: "", email: "", phone: "" },
    attempts: (paymentData.attempts || []).map((a) => ({
      attemptedAt: a.attemptedAt ? (a.attemptedAt instanceof Date ? a.attemptedAt.toISOString() : a.attemptedAt) : new Date().toISOString(),
      status: a.status || "",
      errorCode: a.errorCode || "",
      errorMessage: a.errorMessage || "",
      paymentMethod: a.paymentMethod || "",
    })),
    refund: paymentData.refund || { amount: 0, refundId: "", refundedAt: null, reason: "", status: "" },
    initiatedAt: paymentData.initiatedAt || new Date().toISOString(),
    completedAt: paymentData.completedAt || null,
    failedAt: paymentData.failedAt || null,
    failureReason: paymentData.failureReason || "",
    metadata: paymentData.metadata || {},
    rawGatewayResponse: paymentData.rawGatewayResponse || {},
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatPayment(item);
};

const getPaymentById = async (paymentId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { paymentId },
  }));
  if (!result.Item) return null;
  return formatPayment(result.Item);
};

const getPaymentsByOrder = async (orderId) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "order-index",
    KeyConditionExpression: "orderId = :oid",
    ExpressionAttributeValues: { ":oid": orderId },
    ScanIndexForward: false,
  }));
  return (result.Items || []).map(formatPayment);
};

const getLatestPaymentByOrder = async (orderId) => {
  const payments = await getPaymentsByOrder(orderId);
  if (payments.length === 0) return null;
  return payments[0];
};

const getPaymentByGatewayOrderId = async (gatewayOrderId) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "gatewayOrderId = :goid",
    ExpressionAttributeValues: { ":goid": gatewayOrderId },
  }));
  if (!result.Items || result.Items.length === 0) return null;
  const sorted = result.Items.sort((a, b) => b.createdAt - a.createdAt);
  return formatPayment(sorted[0]);
};

const getUserPayments = async (userId, options = {}) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "user-payments-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    ScanIndexForward: false,
  }));

  const allItems = (result.Items || []).map(formatPayment);
  allItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = allItems.length;
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const paginated = allItems.slice(skip, skip + limit);

  return { items: paginated, total, page, limit, pages: Math.ceil(total / limit) };
};

const getAllPayments = async (filters = {}) => {
  const params = { TableName: TABLE };

  const filterParts = [];
  const values = {};
  const names = {};

  if (filters.status) {
    filterParts.push("#st = :status");
    values[":status"] = filters.status;
    names["#st"] = "status";
  }

  if (filters.gateway) {
    filterParts.push("gateway = :gw");
    values[":gw"] = filters.gateway;
  }

  if (filters.search) {
    filterParts.push("(contains(orderNumber, :search) OR contains(gatewayOrderId, :search) OR contains(gatewayPaymentId, :search))");
    values[":search"] = filters.search;
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
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const paginated = allItems.slice(skip, skip + limit);

  const successItems = allItems.filter((p) => p.status === "success");
  const totalRevenue = successItems.reduce((sum, p) => sum + (p.amount || 0), 0);

  return {
    items: paginated.map(formatPayment),
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
    summary: {
      totalRevenue,
      successfulPayments: successItems.length,
      totalPayments: total,
    },
  };
};

const updatePayment = async (paymentId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  const cleanUpdates = {};
  for (const [key, value] of Object.entries(updates)) {
    if (key === "paymentId" || key === "_id") continue;
    if (value instanceof Date) cleanUpdates[key] = value.toISOString();
    else cleanUpdates[key] = value;
  }

  Object.entries(cleanUpdates).forEach(([key, value]) => {
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

  if (expressions.length === 0) return null;

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { paymentId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatPayment(result.Attributes);
};

const savePayment = async (payment) => {
  const item = { ...payment };
  if (item._id && !item.paymentId) item.paymentId = item._id;
  delete item._id;
  delete item.id;

  item.updatedAt = Date.now();

  if (item.attempts) {
    item.attempts = item.attempts.map((a) => ({
      ...a,
      attemptedAt: a.attemptedAt instanceof Date ? a.attemptedAt.toISOString() : (a.attemptedAt || new Date().toISOString()),
    }));
  }

  if (item.completedAt instanceof Date) item.completedAt = item.completedAt.toISOString();
  if (item.failedAt instanceof Date) item.failedAt = item.failedAt.toISOString();
  if (item.initiatedAt instanceof Date) item.initiatedAt = item.initiatedAt.toISOString();

  if (item.refund?.refundedAt instanceof Date) {
    item.refund.refundedAt = item.refund.refundedAt.toISOString();
  }

  if (item.rawGatewayResponse) {
    item.rawGatewayResponse = JSON.parse(JSON.stringify(item.rawGatewayResponse));
  }

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatPayment(item);
};

const updateManyPayments = async (filter, updates) => {
  let filterExpression = "";
  const filterValues = {};

  if (filter.orderId) {
    const payments = await getPaymentsByOrder(filter.orderId);
    const filtered = payments.filter((p) => {
      if (filter.status) {
        if (Array.isArray(filter.status)) return filter.status.includes(p.status);
        return p.status === filter.status;
      }
      return true;
    });

    for (const payment of filtered) {
      await updatePayment(payment.paymentId || payment._id, updates);
    }

    return filtered.length;
  }

  return 0;
};

const formatPayment = (item) => {
  if (!item) return null;
  return {
    _id: item.paymentId,
    id: item.paymentId,
    paymentId: item.paymentId,
    order: item.orderId || "",
    orderId: item.orderId || "",
    user: item.userId || "",
    userId: item.userId || "",
    orderNumber: item.orderNumber || "",
    amount: item.amount || 0,
    currency: item.currency || "INR",
    gateway: item.gateway || "cashfree",
    gatewayOrderId: item.gatewayOrderId || "",
    paymentSessionId: item.paymentSessionId || "",
    gatewayPaymentId: item.gatewayPaymentId || "",
    paymentMethod: item.paymentMethod || "",
    paymentGroup: item.paymentGroup || "",
    status: item.status || "initiated",
    bankReference: item.bankReference || "",
    upiId: item.upiId || "",
    cardDetails: item.cardDetails || {},
    customerDetails: item.customerDetails || {},
    attempts: item.attempts || [],
    refund: item.refund || {},
    initiatedAt: item.initiatedAt || null,
    completedAt: item.completedAt || null,
    failedAt: item.failedAt || null,
    failureReason: item.failureReason || "",
    metadata: item.metadata || {},
    rawGatewayResponse: item.rawGatewayResponse || {},
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  createPayment,
  getPaymentById,
  getPaymentsByOrder,
  getLatestPaymentByOrder,
  getPaymentByGatewayOrderId,
  getUserPayments,
  getAllPayments,
  updatePayment,
  savePayment,
  updateManyPayments,
  formatPayment,
};