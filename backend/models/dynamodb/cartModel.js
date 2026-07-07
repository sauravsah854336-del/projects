const { PutCommand, GetCommand, UpdateCommand, DeleteCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("carts");

const getCart = async (userId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { userId },
  }));

  if (!result.Item) return null;
  return formatCart(result.Item);
};

const createCart = async (userId) => {
  const now = Date.now();

  const item = {
    userId,
    items: [],
    coupon: {
      code: "",
      discount: 0,
      discountType: "fixed",
      freeShipping: false,
      description: "",
      appliedAt: null,
    },
    totalItems: 0,
    subtotal: 0,
    total: 0,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatCart(item);
};

const getOrCreateCart = async (userId) => {
  let cart = await getCart(userId);
  if (!cart) cart = await createCart(userId);
  return cart;
};

const updateCart = async (userId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key === "userId" || key === "_id") return;
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
    Key: { userId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatCart(result.Attributes);
};

const saveCart = async (cart) => {
  const item = {
    userId: cart.userId || cart.user,
    items: (cart.items || []).map((i) => ({
      product: String(i.product?._id || i.product || ""),
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
      comparePrice: Number(i.comparePrice) || 0,
      name: i.name || "",
      image: i.image || "",
      vendor: String(i.vendor?._id || i.vendor || ""),
      storeName: i.storeName || "",
      maxQuantity: Number(i.maxQuantity) || 99,
    })),
    coupon: cart.coupon || {
      code: "",
      discount: 0,
      discountType: "fixed",
      freeShipping: false,
      description: "",
      appliedAt: null,
    },
    totalItems: Number(cart.totalItems) || 0,
    subtotal: Number(cart.subtotal) || 0,
    total: Number(cart.total) || 0,
    createdAt: cart.createdAt instanceof Date ? cart.createdAt.getTime() : (cart.createdAt || Date.now()),
    updatedAt: Date.now(),
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatCart(item);
};

const clearCart = async (userId) => {
  return await updateCart(userId, {
    items: [],
    totalItems: 0,
    subtotal: 0,
    total: 0,
    coupon: {
      code: "",
      discount: 0,
      discountType: "fixed",
      freeShipping: false,
      description: "",
      appliedAt: null,
    },
  });
};

const deleteCart = async (userId) => {
  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { userId },
  }));
};

const formatCart = (item) => {
  if (!item) return null;
  return {
    _id: item.userId,
    id: item.userId,
    user: item.userId,
    userId: item.userId,
    items: (item.items || []).map((i) => ({
      product: String(i.product?._id || i.product || ""),
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) || 0,
      comparePrice: Number(i.comparePrice) || 0,
      name: i.name || "",
      image: i.image || "",
      vendor: String(i.vendor?._id || i.vendor || ""),
      storeName: i.storeName || "",
      maxQuantity: Number(i.maxQuantity) || 99,
    })),
    coupon: item.coupon || {
      code: "",
      discount: 0,
      discountType: "fixed",
      freeShipping: false,
      description: "",
      appliedAt: null,
    },
    totalItems: Number(item.totalItems) || 0,
    subtotal: Number(item.subtotal) || 0,
    total: Number(item.total) || 0,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  getCart,
  createCart,
  getOrCreateCart,
  updateCart,
  saveCart,
  clearCart,
  deleteCart,
  formatCart,
};