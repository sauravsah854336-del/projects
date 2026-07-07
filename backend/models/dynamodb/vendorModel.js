const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("vendors");

const createVendor = async (vendorData) => {
  const vendorId = uuidv4();
  const now = Date.now();

  const item = {
    vendorId,
    userId: vendorData.userId || "",
    storeName: vendorData.storeName || "",
    storeDescription: vendorData.storeDescription || "",
    storeLogo: vendorData.storeLogo || "",
    storeBanner: vendorData.storeBanner || "",
    businessType: vendorData.businessType || "individual",
    panNumber: vendorData.panNumber || "",
    panDocument: vendorData.panDocument || { url: "", filename: "" },
    gstNumber: vendorData.gstNumber || "",
    gstDocument: vendorData.gstDocument || { url: "", filename: "" },
    businessRegistrationDoc: vendorData.businessRegistrationDoc || { url: "", filename: "" },
    cancelledCheque: vendorData.cancelledCheque || { url: "", filename: "" },
    bankDetails: vendorData.bankDetails || {
      accountHolderName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
      accountType: "",
    },
    businessAddress: vendorData.businessAddress || {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
    warehouseAddress: vendorData.warehouseAddress || {
      sameAsBusiness: true,
      street: "",
      city: "",
      state: "",
      postalCode: "",
    },
    primaryCategory: vendorData.primaryCategory || "",
    agreementsAccepted: vendorData.agreementsAccepted || false,
    agreementDate: vendorData.agreementDate || null,
    approvalStatus: vendorData.approvalStatus || "pending",
    rejectionReason: vendorData.rejectionReason || "",
    approvedAt: vendorData.approvedAt || null,
    approvedBy: vendorData.approvedBy || "",
    commission: vendorData.commission || 10,
    totalSales: vendorData.totalSales || 0,
    totalEarnings: vendorData.totalEarnings || 0,
    isDeleted: vendorData.isDeleted || false,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: item,
  }));

  return formatVendor(item);
};

const getVendorById = async (vendorId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { vendorId },
  }));

  if (!result.Item) return null;
  return formatVendor(result.Item);
};

const getVendorByUserId = async (userId) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "userId-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
  }));

  if (!result.Items || result.Items.length === 0) return null;
  return formatVendor(result.Items[0]);
};

const getVendorByStoreName = async (storeName) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "storeName-index",
    KeyConditionExpression: "storeName = :sn",
    ExpressionAttributeValues: { ":sn": storeName },
  }));

  if (!result.Items || result.Items.length === 0) return null;
  return formatVendor(result.Items[0]);
};

const getVendorsByStatus = async (status, limit = 50) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "approvalStatus = :status AND isDeleted = :notDeleted",
    ExpressionAttributeValues: {
      ":status": status,
      ":notDeleted": false,
    },
    Limit: limit,
  }));

  return (result.Items || []).map(formatVendor);
};

const getAllVendors = async (filters = {}) => {
  const params = {
    TableName: TABLE,
  };

  const filterParts = ["isDeleted = :notDeleted"];
  const values = { ":notDeleted": false };

  if (filters.status) {
    filterParts.push("approvalStatus = :status");
    values[":status"] = filters.status;
  }

  params.FilterExpression = filterParts.join(" AND ");
  params.ExpressionAttributeValues = values;

  if (filters.limit) params.Limit = filters.limit;

  const result = await docClient.send(new ScanCommand(params));

  return {
    items: (result.Items || []).map(formatVendor),
    count: result.Count || 0,
    lastKey: result.LastEvaluatedKey || null,
  };
};

const updateVendor = async (vendorId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key === "vendorId" || key === "_id") return;
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
    Key: { vendorId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatVendor(result.Attributes);
};

const findVendorByPAN = async (panNumber) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "panNumber = :pan AND isDeleted = :notDeleted",
    ExpressionAttributeValues: {
      ":pan": panNumber.toUpperCase(),
      ":notDeleted": false,
    },
  }));

  if (!result.Items || result.Items.length === 0) return null;
  return formatVendor(result.Items[0]);
};

const findVendorByGST = async (gstNumber) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "gstNumber = :gst AND isDeleted = :notDeleted",
    ExpressionAttributeValues: {
      ":gst": gstNumber.toUpperCase(),
      ":notDeleted": false,
    },
  }));

  if (!result.Items || result.Items.length === 0) return null;
  return formatVendor(result.Items[0]);
};

const findVendorByStoreNameCaseInsensitive = async (storeName) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "isDeleted = :notDeleted",
    ExpressionAttributeValues: {
      ":notDeleted": false,
    },
  }));

  if (!result.Items) return null;

  const found = result.Items.find(
    (v) => v.storeName.toLowerCase() === storeName.toLowerCase()
  );

  return found ? formatVendor(found) : null;
};

const countVendorsByStatus = async (status) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "approvalStatus = :status AND isDeleted = :notDeleted",
    ExpressionAttributeValues: {
      ":status": status,
      ":notDeleted": false,
    },
    Select: "COUNT",
  }));

  return result.Count || 0;
};

const formatVendor = (item) => {
  if (!item) return null;

  return {
    _id: item.vendorId,
    id: item.vendorId,
    vendorId: item.vendorId,
    userId: item.userId || "",
    storeName: item.storeName || "",
    storeDescription: item.storeDescription || "",
    storeLogo: item.storeLogo || "",
    storeBanner: item.storeBanner || "",
    businessType: item.businessType || "individual",
    panNumber: item.panNumber || "",
    panDocument: item.panDocument || { url: "", filename: "" },
    gstNumber: item.gstNumber || "",
    gstDocument: item.gstDocument || { url: "", filename: "" },
    businessRegistrationDoc: item.businessRegistrationDoc || { url: "", filename: "" },
    cancelledCheque: item.cancelledCheque || { url: "", filename: "" },
    bankDetails: item.bankDetails || {},
    businessAddress: item.businessAddress || {},
    warehouseAddress: item.warehouseAddress || {},
    primaryCategory: item.primaryCategory || "",
    agreementsAccepted: item.agreementsAccepted || false,
    agreementDate: item.agreementDate || null,
    approvalStatus: item.approvalStatus || "pending",
    rejectionReason: item.rejectionReason || "",
    approvedAt: item.approvedAt || null,
    approvedBy: item.approvedBy || "",
    commission: item.commission || 10,
    totalSales: item.totalSales || 0,
    totalEarnings: item.totalEarnings || 0,
    isDeleted: item.isDeleted || false,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  createVendor,
  getVendorById,
  getVendorByUserId,
  getVendorByStoreName,
  getVendorsByStatus,
  getAllVendors,
  updateVendor,
  findVendorByPAN,
  findVendorByGST,
  findVendorByStoreNameCaseInsensitive,
  countVendorsByStatus,
  formatVendor,
};