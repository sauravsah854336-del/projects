const { v4: uuidv4 } = require("uuid");
const { PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, getTableName } = require("../../config/dynamodb");

const TABLE = getTableName("reviews");

const createReview = async (reviewData) => {
  const reviewId = uuidv4();
  const now = Date.now();

  const item = {
    productId: reviewData.productId || reviewData.product || "",
    reviewId,
    userId: reviewData.userId || reviewData.user || "",
    orderId: reviewData.orderId || reviewData.order || "",
    rating: reviewData.rating || 0,
    title: reviewData.title || "",
    body: reviewData.body || "",
    images: reviewData.images || [],
    isVerifiedPurchase: reviewData.isVerifiedPurchase !== false,
    helpfulVotes: reviewData.helpfulVotes || [],
    isDeleted: false,
    deletedBy: null,
    createdAt: now,
    updatedAt: now,
  };

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatReview(item);
};

const getReviewById = async (productId, reviewId) => {
  const result = await docClient.send(new GetCommand({
    TableName: TABLE,
    Key: { productId, reviewId },
  }));
  if (!result.Item) return null;
  return formatReview(result.Item);
};

const getReviewByReviewId = async (reviewId) => {
  const result = await docClient.send(new ScanCommand({
    TableName: TABLE,
    FilterExpression: "reviewId = :rid",
    ExpressionAttributeValues: { ":rid": reviewId },
  }));
  if (!result.Items || result.Items.length === 0) return null;
  return formatReview(result.Items[0]);
};

const getProductReviews = async (productId, options = {}) => {
  const params = {
    TableName: TABLE,
    KeyConditionExpression: "productId = :pid",
    ExpressionAttributeValues: { ":pid": productId },
  };

  const filterParts = ["isDeleted = :notDeleted"];
  params.ExpressionAttributeValues[":notDeleted"] = false;

  if (options.rating) {
    filterParts.push("rating = :rating");
    params.ExpressionAttributeValues[":rating"] = Number(options.rating);
  }

  params.FilterExpression = filterParts.join(" AND ");

  const result = await docClient.send(new QueryCommand(params));
  let reviews = (result.Items || []).map(formatReview);

  const sortMap = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    highest: (a, b) => b.rating - a.rating,
    lowest: (a, b) => a.rating - b.rating,
    helpful: (a, b) => (b.helpfulVotes?.length || 0) - (a.helpfulVotes?.length || 0),
  };

  reviews.sort(sortMap[options.sort] || sortMap.newest);

  const total = reviews.length;
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;
  const paginated = reviews.slice(skip, skip + limit);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
  });

  return { reviews: paginated, ratingBreakdown: breakdown, total, page, limit, pages: Math.ceil(total / limit) };
};

const getUserReviews = async (userId) => {
  const result = await docClient.send(new QueryCommand({
    TableName: TABLE,
    IndexName: "user-reviews-index",
    KeyConditionExpression: "userId = :uid",
    ExpressionAttributeValues: { ":uid": userId },
    ScanIndexForward: false,
  }));

  return (result.Items || [])
    .filter((r) => !r.isDeleted)
    .map(formatReview);
};

const getExistingReview = async (productId, userId) => {
  const reviews = await getProductReviews(productId, { limit: 1000 });
  return reviews.reviews.find((r) => r.userId === userId && !r.isDeleted) || null;
};

const getAllReviews = async (filters = {}) => {
  const params = { TableName: TABLE };

  const filterParts = ["isDeleted = :notDeleted"];
  const values = { ":notDeleted": false };

  if (filters.rating) {
    filterParts.push("rating = :rating");
    values[":rating"] = Number(filters.rating);
  }

  params.FilterExpression = filterParts.join(" AND ");
  params.ExpressionAttributeValues = values;

  const allItems = [];
  let lastKey = null;

  do {
    if (lastKey) params.ExclusiveStartKey = lastKey;
    const result = await docClient.send(new ScanCommand(params));
    allItems.push(...(result.Items || []));
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  let reviews = allItems.map(formatReview);

  const sortMap = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    highest: (a, b) => b.rating - a.rating,
    lowest: (a, b) => a.rating - b.rating,
  };

  reviews.sort(sortMap[filters.sort] || sortMap.newest);

  const total = reviews.length;
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;
  const paginated = reviews.slice(skip, skip + limit);

  return { items: paginated, total, page, limit, pages: Math.ceil(total / limit) };
};

const getVendorProductReviews = async (vendorProductIds, filters = {}) => {
  const allReviews = [];

  for (const pid of vendorProductIds) {
    const result = await getProductReviews(pid, { limit: 1000 });
    allReviews.push(...result.reviews);
  }

  if (filters.rating) {
    const filtered = allReviews.filter((r) => r.rating === Number(filters.rating));
    allReviews.length = 0;
    allReviews.push(...filtered);
  }

  const sortMap = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    highest: (a, b) => b.rating - a.rating,
    lowest: (a, b) => a.rating - b.rating,
  };

  allReviews.sort(sortMap[filters.sort] || sortMap.newest);

  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  allReviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) breakdown[r.rating]++;
  });

  const total = allReviews.length;
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;
  const paginated = allReviews.slice(skip, skip + limit);

  return { items: paginated, ratingBreakdown: breakdown, total, page, limit, pages: Math.ceil(total / limit) };
};

const updateReview = async (productId, reviewId, updates) => {
  const expressions = [];
  const names = {};
  const values = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (key === "productId" || key === "reviewId" || key === "_id") return;
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
    Key: { productId, reviewId },
    UpdateExpression: `SET ${expressions.join(", ")}`,
    ExpressionAttributeNames: names,
    ExpressionAttributeValues: values,
    ReturnValues: "ALL_NEW",
  }));

  return formatReview(result.Attributes);
};

const saveReview = async (review) => {
  const item = { ...review };
  if (item._id) delete item._id;
  if (item.id) delete item.id;
  item.updatedAt = Date.now();

  await docClient.send(new PutCommand({ TableName: TABLE, Item: item }));
  return formatReview(item);
};

const recalcProductRating = async (productId) => {
  const { updateProduct } = require("./productModel");

  const result = await getProductReviews(productId, { limit: 10000 });
  const reviews = result.reviews;

  if (reviews.length > 0) {
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

    await updateProduct(productId, {
      averageRating,
      totalReviews: reviews.length,
    });
  } else {
    await updateProduct(productId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

const formatReview = (item) => {
  if (!item) return null;
  return {
    _id: item.reviewId,
    id: item.reviewId,
    reviewId: item.reviewId,
    product: item.productId || "",
    productId: item.productId || "",
    user: item.userId || "",
    userId: item.userId || "",
    order: item.orderId || "",
    orderId: item.orderId || "",
    rating: item.rating || 0,
    title: item.title || "",
    body: item.body || "",
    images: item.images || [],
    isVerifiedPurchase: item.isVerifiedPurchase !== false,
    helpfulVotes: item.helpfulVotes || [],
    isDeleted: item.isDeleted || false,
    deletedBy: item.deletedBy || null,
    createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
    updatedAt: item.updatedAt ? new Date(item.updatedAt) : new Date(),
  };
};

module.exports = {
  createReview,
  getReviewById,
  getReviewByReviewId,
  getProductReviews,
  getUserReviews,
  getExistingReview,
  getAllReviews,
  getVendorProductReviews,
  updateReview,
  saveReview,
  recalcProductRating,
  formatReview,
};