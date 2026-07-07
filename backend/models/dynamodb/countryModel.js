const { PutCommand, GetCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("countries");

const getCountryByCode = async (code) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { code: code.toUpperCase().trim() },
  }));
  if (!result.Item) return null;
  return formatCountry(result.Item);
};

const getAllCountries = async (activeOnly = true) => {
  const params = { TableName: TABLE };

  if (activeOnly) {
    params.FilterExpression = "isActive = :active";
    params.ExpressionAttributeValues = { ":active": true };
  }

  const allItems = [];
  let lastKey = null;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await docClient.send(new ScanCommand(params));
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  const countries = allItems.map(formatCountry);
  countries.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });

  return countries;
};

const getDefaultCountry = async () => {
  const all = await getAllCountries(true);
  return all.find((c) => c.isDefault) || all[0] || null;
};

const updateCountry = async (code, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key === "code" || key === "_id") return;
    if (key === "type") {
      names["#taxType"] = "tax";
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
    Key: { code: code.toUpperCase().trim() },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatCountry(result.Attributes);
};

const saveCountry = async (country) => {
  const item = { ...country };
  if (item._id) delete item._id;
  if (item.id) delete item.id;
  item.updatedAt = Date.now();

  if (item.lastRateUpdate instanceof Date) item.lastRateUpdate = item.lastRateUpdate.toISOString();

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatCountry(item);
};

const formatCountry = (item) => {
  if (!item) return null;
  return {
    _id: item.code,
    id: item.code,
    code: item.code || "",
    name: item.name || "",
    nativeName: item.nativeName || "",
    flag: item.flag || "",
    dialCode: item.dialCode || "+91",
    currency: item.currency || { code: "INR", symbol: "₹", name: "Indian Rupee" },
    exchangeRate: item.exchangeRate || 1,
    domain: item.domain || "",
    language: item.language || "en",
    timezone: item.timezone || "",
    tax: item.tax || { type: "None", rate: 0, label: "", includedInPrice: false },
    shipping: item.shipping || {
      freeShippingThreshold: 0,
      standardCost: 0,
      expressCost: 0,
      estimatedDays: { standard: 7, express: 3 },
    },
    paymentMethods: item.paymentMethods || [],
    isActive: item.isActive !== false,
    isDefault: item.isDefault || false,
    lastRateUpdate: item.lastRateUpdate || null,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  getCountryByCode,
  getAllCountries,
  getDefaultCountry,
  updateCountry,
  saveCountry,
  formatCountry,
};