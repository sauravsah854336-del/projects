const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const config = {
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

if (process.env.DYNAMODB_ENDPOINT) {
  config.endpoint = process.env.DYNAMODB_ENDPOINT;
  console.log(`🔵 DynamoDB Local: ${process.env.DYNAMODB_ENDPOINT}`);
} else {
  console.log(`🔴 DynamoDB Production: AWS ${config.region}`);
}

const client = new DynamoDBClient(config);
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_PREFIX = process.env.DYNAMODB_TABLE_PREFIX || "design247_ecommerce_";

const getTableName = (name) => `${TABLE_PREFIX}${name}`;

console.log(`✅ DynamoDB configured`);
console.log(`   Table Prefix: ${TABLE_PREFIX}`);

module.exports = {
  client,
  docClient,
  TABLE_PREFIX,
  getTableName,
};