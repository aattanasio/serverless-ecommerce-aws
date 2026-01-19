const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { UpdateCommand, GetCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

exports.handler = async (event) => {
  console.log("=== INVENTORY SERVICE STARTED ===");
  console.log("Received event:", JSON.stringify(event));
  
  const order = event.detail;  // Already an object, not a string
  
  try {
    console.log("Checking inventory for:", order.productId);
    
    // Check stock
    const result = await dynamodb.send(new GetCommand({
      TableName: "Inventory",
      Key: { productId: order.productId }
    }));
    
    if (!result.Item) {
      throw new Error(`Product ${order.productId} not found`);
    }
    
    console.log("Current stock:", result.Item.stock);
    
    if (result.Item.stock < order.quantity) {
      throw new Error(`Insufficient stock. Available: ${result.Item.stock}, Requested: ${order.quantity}`);
    }
    
    // Decrease stock
    await dynamodb.send(new UpdateCommand({
      TableName: "Inventory",
      Key: { productId: order.productId },
      UpdateExpression: "SET stock = stock - :qty",
      ExpressionAttributeValues: { ":qty": order.quantity }
    }));
    
    console.log(`✓ Inventory updated for order ${order.orderId}. Decreased by ${order.quantity}`);
    return { status: "SUCCESS" };
  } catch (error) {
    console.error("❌ Inventory service error:", error);
    throw error;
  }
};
