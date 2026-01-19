const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { PutCommand, DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { EventBridgeClient, PutEventsCommand } = require("@aws-sdk/client-eventbridge");

const dynamodb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const eventbridge = new EventBridgeClient({});

exports.handler = async (event) => {
  console.log("=== ORDER PROCESSOR STARTED ===");
  console.log("Received event:", JSON.stringify(event));

  try {
    // Handle both direct invocation and API Gateway proxy integration
    let order;

    if (event.body) {
      // API Gateway proxy integration
      order = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      // Direct invocation (for testing)
      order = event;
    }

    console.log("Parsed order:", JSON.stringify(order));

    // Validate order data
    if (!order || !order.productId || !order.quantity || !order.customerEmail) {
      throw new Error("Missing required fields: productId, quantity, or customerEmail");
    }

    const orderId = `ORDER-${Date.now()}`;

    console.log("Processing order:", orderId);

    // Save order to DynamoDB
    console.log("Saving to DynamoDB...");
    await dynamodb.send(new PutCommand({
      TableName: "Orders",
      Item: {
        orderId,
        productId: order.productId,
        quantity: order.quantity,
        customerEmail: order.customerEmail,
        status: "PENDING",
        timestamp: new Date().toISOString()
      }
    }));
    console.log("✓ Order saved to DynamoDB");

    // Publish event to EventBridge
    console.log("Publishing to EventBridge...");
    const eventResult = await eventbridge.send(new PutEventsCommand({
      Entries: [{
        Source: "ecommerce.orders",
        DetailType: "OrderPlaced",
        Detail: JSON.stringify({
          orderId,
          productId: order.productId,
          quantity: order.quantity,
          customerEmail: order.customerEmail
        }),
        EventBusName: "ecommerce-events"
      }]
    }));

    console.log("✓ EventBridge result:", JSON.stringify(eventResult));

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        orderId,
        message: "Order placed successfully",
        eventPublished: true
      })
    };
  } catch (error) {
    console.error("❌ ERROR:", error);
    console.error("Error stack:", error.stack);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: JSON.stringify({
        error: error.message,
        details: error.stack
      })
    };
  }
};
