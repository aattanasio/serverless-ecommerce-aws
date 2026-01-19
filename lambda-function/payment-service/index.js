exports.handler = async (event) => {
  console.log("=== PAYMENT SERVICE STARTED ===");
  console.log("Received event:", JSON.stringify(event));
  
  const order = event.detail;  // Already an object, not a string
  
  try {
    console.log("Processing payment for order:", order.orderId);
    
    // Mock payment processing (simulate 1 second delay)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate 95% success rate
    if (Math.random() > 0.05) {
      console.log(`✓ Payment processed successfully for order ${order.orderId}`);
      return { status: "SUCCESS" };
    } else {
      throw new Error("Payment declined by gateway");
    }
  } catch (error) {
    console.error("❌ Payment service error:", error);
    throw error;
  }
};
