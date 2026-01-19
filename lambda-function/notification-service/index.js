const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const sns = new SNSClient({});

exports.handler = async (event) => {
  console.log("=== NOTIFICATION SERVICE STARTED ===");
  console.log("Received event:", JSON.stringify(event));
  
  try {
    // EventBridge delivers 'detail' as an object, not a string
    const order = event.detail;
    
    console.log("Order details:", JSON.stringify(order));
    console.log("SNS Topic ARN:", process.env.SNS_TOPIC_ARN);
    
    await sns.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: "Order Confirmation",
      Message: `Your order ${order.orderId} for ${order.quantity}x ${order.productId} has been received!\n\nThank you for your purchase.`
    }));
    
    console.log("✓ Notification sent for order", order.orderId);
    return { status: "SUCCESS" };
  } catch (error) {
    console.error("❌ Notification service error:", error);
    throw error;
  }
};
