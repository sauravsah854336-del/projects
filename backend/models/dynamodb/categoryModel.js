const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("categories");

const createCategory = async (categoryData) => {
  const categoryId = uuidv4();
  const now = Date.now();

  const item = {
    categoryId,
    name: categoryData.name || "",
    slug: categoryData.slug || "",
    description: categoryData.description || "",
    image: categoryData.image || "",
    parent: categoryData.parent || "",
    isActive: categoryData.isActive !== false,
    createdBy: categoryData.createdBy || "",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatCategory(item);
};

const getCategoryById = async (categoryId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { categoryId },
  }));
  if (!result.Item) return null;
  return formatCategory(result.Item);
};

const getCategoryBySlug = async (slug) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "slug-index",
    KeyConditionExpression: "slug = :slug",
    ExpressionAttributeValues: { ":slug": slug },
  }));
  if (!result.Items || result.Items.length === 0) return null;
  return formatCategory(result.Items[0]);
};

const getCategoriesByParent = async (parentId) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "isActive = :active",
    ExpressionAttributeValues: {
      ":active": true,
    },
  }));

  const items = (result.Items || [])
    .filter((item) => String(item.parent || "") === String(parentId || ""))
    .map(formatCategory);

  items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return items;
};

const getAllCategories = async (includeInactive = false) => {
  const params = { TableName: TABLE };

  if (!includeInactive) {
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

  const categories = allItems.map(formatCategory);
  categories.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return categories;
};

const getRootCategories = async () => {
  const all = await getAllCategories();
  return all.filter((c) => !c.parent || c.parent === "");
};

const updateCategory = async (categoryId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key === "categoryId" || key === "_id") return;
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
    Key: { categoryId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatCategory(result.Attributes);
};

const deleteCategory = async (categoryId) => {
  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { categoryId },
  }));
};

const findCategoryBySlugAndParent = async (slug, parentId) => {
  const all = await getAllCategories(true);
  return all.find(
    (c) => c.slug === slug && String(c.parent || "") === String(parentId || "")
  ) || null;
};

const countCategories = async (filters = {}) => {
  const all = await getAllCategories(true);
  let filtered = all;

  if (filters.parent !== undefined) {
    if (filters.parent === null || filters.parent === "") {
      filtered = filtered.filter((c) => !c.parent || c.parent === "");
    } else {
      filtered = filtered.filter((c) => c.parent === filters.parent);
    }
  }

  if (filters.isActive !== undefined) {
    filtered = filtered.filter((c) => c.isActive === filters.isActive);
  }

  return filtered.length;
};

const formatCategory = (item) => {
  if (!item) return null;
  return {
    _id: item.categoryId,
    id: item.categoryId,
    categoryId: item.categoryId,
    name: item.name || "",
    slug: item.slug || "",
    description: item.description || "",
    image: item.image || "",
    parent: item.parent || "",
    isActive: item.isActive !== false,
    createdBy: item.createdBy || "",
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  createCategory,
  getCategoryById,
  getCategoryBySlug,
  getCategoriesByParent,
  getAllCategories,
  getRootCategories,
  updateCategory,
  deleteCategory,
  findCategoryBySlugAndParent,
  countCategories,
  formatCategory,
};