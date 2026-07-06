require("dotenv").config();
const { CreateTableCommand, DescribeTableCommand } = require("@aws-sdk/client-dynamodb");
const { client } = require("../config/dynamodb");

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "design247_ecommerce_";

const tables = [
  {
    name: "users",
    schema: {
      TableName: `${TABLE_PREFIX}users`,
      KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "email", AttributeType: "S" },
        { AttributeName: "role", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "email-index",
          KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: "role-index",
          KeySchema: [{ AttributeName: "role", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "products",
    schema: {
      TableName: `${TABLE_PREFIX}products`,
      KeySchema: [{ AttributeName: "productId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "productId", AttributeType: "S" },
        { AttributeName: "slug", AttributeType: "S" },
        { AttributeName: "vendorId", AttributeType: "S" },
        { AttributeName: "category", AttributeType: "S" },
        { AttributeName: "createdAt", AttributeType: "N" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "slug-index",
          KeySchema: [{ AttributeName: "slug", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: "vendor-index",
          KeySchema: [
            { AttributeName: "vendorId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: "category-index",
          KeySchema: [
            { AttributeName: "category", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "orders",
    schema: {
      TableName: `${TABLE_PREFIX}orders`,
      KeySchema: [{ AttributeName: "orderId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "orderId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "createdAt", AttributeType: "N" },
        { AttributeName: "status", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "user-orders-index",
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: "status-index",
          KeySchema: [
            { AttributeName: "status", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "carts",
    schema: {
      TableName: `${TABLE_PREFIX}carts`,
      KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "wishlists",
    schema: {
      TableName: `${TABLE_PREFIX}wishlists`,
      KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "userId", AttributeType: "S" },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "vendors",
    schema: {
      TableName: `${TABLE_PREFIX}vendors`,
      KeySchema: [{ AttributeName: "vendorId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "vendorId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "storeName", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "userId-index",
          KeySchema: [{ AttributeName: "userId", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: "storeName-index",
          KeySchema: [{ AttributeName: "storeName", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "categories",
    schema: {
      TableName: `${TABLE_PREFIX}categories`,
      KeySchema: [{ AttributeName: "categoryId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "categoryId", AttributeType: "S" },
        { AttributeName: "slug", AttributeType: "S" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "slug-index",
          KeySchema: [{ AttributeName: "slug", KeyType: "HASH" }],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "payments",
    schema: {
      TableName: `${TABLE_PREFIX}payments`,
      KeySchema: [{ AttributeName: "paymentId", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "paymentId", AttributeType: "S" },
        { AttributeName: "orderId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "createdAt", AttributeType: "N" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "order-index",
          KeySchema: [
            { AttributeName: "orderId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
        {
          IndexName: "user-payments-index",
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "reviews",
    schema: {
      TableName: `${TABLE_PREFIX}reviews`,
      KeySchema: [
        { AttributeName: "productId", KeyType: "HASH" },
        { AttributeName: "reviewId", KeyType: "RANGE" },
      ],
      AttributeDefinitions: [
        { AttributeName: "productId", AttributeType: "S" },
        { AttributeName: "reviewId", AttributeType: "S" },
        { AttributeName: "userId", AttributeType: "S" },
        { AttributeName: "createdAt", AttributeType: "N" },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "user-reviews-index",
          KeySchema: [
            { AttributeName: "userId", KeyType: "HASH" },
            { AttributeName: "createdAt", KeyType: "RANGE" },
          ],
          Projection: { ProjectionType: "ALL" },
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "coupons",
    schema: {
      TableName: `${TABLE_PREFIX}coupons`,
      KeySchema: [{ AttributeName: "code", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "code", AttributeType: "S" },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
  {
    name: "countries",
    schema: {
      TableName: `${TABLE_PREFIX}countries`,
      KeySchema: [{ AttributeName: "code", KeyType: "HASH" }],
      AttributeDefinitions: [
        { AttributeName: "code", AttributeType: "S" },
      ],
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
  },
];

const tableExists = async (tableName) => {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    return true;
  } catch (err) {
    if (err.name === "ResourceNotFoundException") return false;
    throw err;
  }
};

const createTable = async (tableConfig) => {
  const tableName = tableConfig.schema.TableName;
  
  const exists = await tableExists(tableName);
  
  if (exists) {
    console.log(`⏭️  Table already exists: ${tableName}`);
    return { name: tableName, status: "exists" };
  }

  try {
    await client.send(new CreateTableCommand(tableConfig.schema));
    console.log(`✅ Created table: ${tableName}`);
    return { name: tableName, status: "created" };
  } catch (err) {
    console.error(`❌ Failed to create ${tableName}:`, err.message);
    return { name: tableName, status: "failed", error: err.message };
  }
};

const createAllTables = async () => {
  console.log("═══════════════════════════════════════════════");
  console.log("🚀 Creating DynamoDB Tables");
  console.log(`   Prefix: ${TABLE_PREFIX}`);
  console.log(`   Region: ${process.env.AWS_REGION || "ap-south-1"}`);
  console.log("═══════════════════════════════════════════════\n");

  const results = [];

  for (const table of tables) {
    const result = await createTable(table);
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.log("\n═══════════════════════════════════════════════");
  console.log("📊 Summary:");
  const created = results.filter((r) => r.status === "created").length;
  const existing = results.filter((r) => r.status === "exists").length;
  const failed = results.filter((r) => r.status === "failed").length;

  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⏭️  Already existed: ${existing}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Total: ${results.length}`);
  console.log("═══════════════════════════════════════════════");

  if (failed > 0) {
    console.log("\n❌ Failed tables:");
    results
      .filter((r) => r.status === "failed")
      .forEach((r) => console.log(`   - ${r.name}: ${r.error}`));
  }

  console.log("\n✨ Done!");
  process.exit(0);
};

createAllTables();