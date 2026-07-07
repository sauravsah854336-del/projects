const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, DeleteCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("users");

const createUser = async (userData) => {
  const userId = uuidv4();
  const now = Date.now();

  const item = {
    userId,
    firstName: userData.firstName,
    lastName: userData.lastName || "",
    email: userData.email.toLowerCase().trim(),
    phone: userData.phone,
    dialCode: userData.dialCode || "+91",
    fullPhone: userData.fullPhone || `${userData.dialCode || "+91"}${userData.phone}`,
    password: userData.password,
    role: userData.role || "customer",
    avatar: userData.avatar || "",
    provider: userData.provider || "local",
    providerId: userData.providerId || "",
    isEmailVerified: userData.isEmailVerified || false,
    isPhoneVerified: userData.isPhoneVerified || false,
    status: userData.status || "active",
    addresses: userData.addresses || [],
    wishlist: userData.wishlist || [],
    refreshTokens: userData.refreshTokens || [],
    lastLogin: null,
    isDeleted: false,
    dateOfBirth: userData.dateOfBirth || null,
    passwordResetOTP: null,
    passwordResetOTPExpiry: null,
    preferredCountry: userData.preferredCountry || "IN",
    preferredCurrency: userData.preferredCurrency || "INR",
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({
    TableName: TABLE,
    Item: item,
  }));

  return { ...item, _id: userId, id: userId };
};

const getUserById = async (userId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { userId },
  }));

  if (!result.Item) return null;

  return formatUser(result.Item);
};

const getUserByIdWithPassword = async (userId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { userId },
  }));

  if (!result.Item) return null;

  return formatUser(result.Item, true);
};

const getUserByEmail = async (email) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email.toLowerCase().trim(),
    },
  }));

  if (!result.Items || result.Items.length === 0) return null;

  return formatUser(result.Items[0]);
};

const getUserByEmailWithPassword = async (email) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "email-index",
    KeyConditionExpression: "email = :email",
    ExpressionAttributeValues: {
      ":email": email.toLowerCase().trim(),
    },
  }));

  if (!result.Items || result.Items.length === 0) return null;

  return formatUser(result.Items[0], true);
};

const getUserByFullPhone = async (fullPhone) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "fullPhone = :fp",
    ExpressionAttributeValues: {
      ":fp": fullPhone,
    },
  }));

  if (!result.Items || result.Items.length === 0) return null;

  return formatUser(result.Items[0]);
};

const getUsersByRole = async (role, limit = 50, lastKey = null) => {
  const params = {
    TableName: TABLE,
    IndexName: "role-index",
    KeyConditionExpression: "#r = :role",
    ExpressionAttributeNames: { "#r": "role" },
    ExpressionAttributeValues: { ":role": role },
    Limit: limit,
    ScanIndexForward: false,
  };

  if (lastKey) params.ExclusiveStartKey = lastKey;

  const result = await docClient.send(new QueryCommand(params));

  return {
    items: (result.Items || []).map((item) => formatUser(item)),
    lastKey: result.LastEvaluatedKey || null,
    count: result.Count || 0,
  };
};

const updateUser = async (userId, updates) => {
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

  if (expressions.length === 0) return null;

  const result = await docClient.send(new UpdateCommand({
    TableName: TABLE,
    Key: { userId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatUser(result.Attributes);
};

const pushRefreshToken = async (userId, tokenObj) => {
  const user = await getUserById(userId);
  if (!user) return null;

  const tokens = user.refreshTokens || [];
  tokens.push(tokenObj);

  return await updateUser(userId, { refreshTokens: tokens });
};

const pullRefreshToken = async (userId, token) => {
  const user = await getUserById(userId);
  if (!user) return null;

  const tokens = (user.refreshTokens || []).filter((t) => t.token !== token);

  return await updateUser(userId, { refreshTokens: tokens });
};

const clearRefreshTokens = async (userId) => {
  return await updateUser(userId, { refreshTokens: [] });
};

const addAddress = async (userId, address) => {
  const user = await getUserById(userId);
  if (!user) return null;

  const addresses = user.addresses || [];
  const addressId = uuidv4();

  if (address.isDefault || addresses.length === 0) {
    addresses.forEach((a) => { a.isDefault = false; });
    address.isDefault = true;
  }

  addresses.push({ ...address, _id: addressId });

  await updateUser(userId, { addresses });

  return addresses;
};

const updateAddress = async (userId, addressId, updates) => {
  const user = await getUserById(userId);
  if (!user) return null;

  const addresses = user.addresses || [];
  const index = addresses.findIndex((a) => a._id === addressId);

  if (index === -1) return null;

  if (updates.isDefault) {
    addresses.forEach((a) => { a.isDefault = false; });
  }

  addresses[index] = { ...addresses[index], ...updates };

  await updateUser(userId, { addresses });

  return addresses;
};

const deleteAddress = async (userId, addressId) => {
  const user = await getUserById(userId);
  if (!user) return null;

  let addresses = user.addresses || [];
  const index = addresses.findIndex((a) => a._id === addressId);

  if (index === -1) return null;

  const wasDefault = addresses[index].isDefault;
  addresses.splice(index, 1);

  if (wasDefault && addresses.length > 0) {
    addresses[0].isDefault = true;
  }

  await updateUser(userId, { addresses });

  return addresses;
};

const setDefaultAddress = async (userId, addressId) => {
  const user = await getUserById(userId);
  if (!user) return null;

  const addresses = user.addresses || [];
  addresses.forEach((a) => {
    a.isDefault = a._id === addressId;
  });

  await updateUser(userId, { addresses });

  return addresses;
};

const addToWishlist = async (userId, productId) => {
  const user = await getUserById(userId);
  if (!user) return null;

  const wishlist = user.wishlist || [];
  if (wishlist.includes(productId)) return wishlist;

  wishlist.push(productId);
  await updateUser(userId, { wishlist });

  return wishlist;
};

const removeFromWishlist = async (userId, productId) => {
  const user = await getUserById(userId);
  if (!user) return null;

  const wishlist = (user.wishlist || []).filter((id) => id !== productId);
  await updateUser(userId, { wishlist });

  return wishlist;
};

const deleteUser = async (userId) => {
  await docClient.send(new DeleteCommand({
    TableName: TABLE,
    Key: { userId },
  }));
};

const softDeleteUser = async (userId) => {
  return await updateUser(userId, { isDeleted: true, status: "inactive" });
};

const countUsersByRole = async (role) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "role-index",
    KeyConditionExpression: "#r = :role",
    ExpressionAttributeNames: { "#r": "role" },
    ExpressionAttributeValues: { ":role": role },
    Select: "COUNT",
  }));

  return result.Count || 0;
};

const searchUsers = async (searchTerm, role = null, limit = 20) => {
  const params = {
    TableName: TABLE,
    Limit: limit,
  };

  let filterParts = [];
  const values = {};
  const names = {};

  if (searchTerm) {
    filterParts.push("(contains(#fn, :search) OR contains(email, :search) OR contains(phone, :search))");
    values[":search"] = searchTerm.toLowerCase();
    names["#fn"] = "firstName";
  }

  if (role) {
    filterParts.push("#r = :role");
    values[":role"] = role;
    names["#r"] = "role";
  }

  filterParts.push("isDeleted = :notDeleted");
  values[":notDeleted"] = false;

  params.FilterExpression = filterParts.join(" AND ");
  params.ExpressionAttributeValues = values;

  if (Object.keys(names).length > 0) {
    params.ExpressionAttributeNames = names;
  }

  const result = await docClient.send(new ScanCommand(params));

  return (result.Items || []).map((item) => formatUser(item));
};

const formatUser = (item, includePassword = false) => {
  if (!item) return null;

  const user = {
    _id: item.userId,
    id: item.userId,
    userId: item.userId,
    firstName: item.firstName,
    lastName: item.lastName || "",
    email: item.email,
    phone: item.phone,
    dialCode: item.dialCode || "+91",
    fullPhone: item.fullPhone || "",
    role: item.role,
    avatar: item.avatar || "",
    provider: item.provider || "local",
    isEmailVerified: item.isEmailVerified || false,
    isPhoneVerified: item.isPhoneVerified || false,
    status: item.status || "active",
    addresses: item.addresses || [],
    wishlist: item.wishlist || [],
    refreshTokens: item.refreshTokens || [],
    lastLogin: item.lastLogin || null,
    isDeleted: item.isDeleted || false,
    dateOfBirth: item.dateOfBirth || null,
    passwordResetOTP: item.passwordResetOTP || null,
    passwordResetOTPExpiry: item.passwordResetOTPExpiry || null,
    preferredCountry: item.preferredCountry || "IN",
    preferredCurrency: item.preferredCurrency || "INR",
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };

  if (includePassword) {
    user.password = item.password;
  }

  return user;
};

module.exports = {
  createUser,
  getUserById,
  getUserByIdWithPassword,
  getUserByEmail,
  getUserByEmailWithPassword,
  getUserByFullPhone,
  getUsersByRole,
  updateUser,
  pushRefreshToken,
  pullRefreshToken,
  clearRefreshTokens,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  addToWishlist,
  removeFromWishlist,
  deleteUser,
  softDeleteUser,
  countUsersByRole,
  searchUsers,
  formatUser,
};