export const TEMPLATE_VARIABLES_SAMPLE = [
  { key: "customerName", label: "Customer Name", example: "John Doe" },
  {
    key: "customerEmail",
    label: "Customer Email",
    example: "john@example.com",
  },
  { key: "orderId", label: "Order ID", example: "#123456" },
  {
    key: "orderedItems",
    label: "Ordered Items",
    example: [
      {
        name: "Spicy Chicken Bowl",
        quantity: 1,
        price: 10.99,
      },
      {
        name: "Vegetable Spring Rolls",
        quantity: 2,
        price: 5.99,
      },
    ],
  },
  { key: "total", label: "Total", example: "$45.67" },
  {
    key: "customerReview",
    label: "Customer Review",
    example: "The food was delicious, but delivery took longer than expected.",
  },
  {
    key: "restaurantName",
    label: "Restaurant Name",
    example: "The Best Restaurant",
  },
];

// Add these constants for templates and AI options
export const MESSAGE_TEMPLATES = [
  {
    name: "Feedback Request",
    content: `
        <p>Hi {{customerName}},</p>
        <p>We hope you enjoyed your recent order from {{restaurantName}}! We're always looking to improve, and your feedback would be invaluable to us.</p>
        <p>Would you take a moment to share your experience? We'd love to hear about:</p>
        <ul>
          <li>How was the quality of your food?</li>
          <li>How was our service?</li>
          <li>Any suggestions for improvement?</li>
        </ul>
        <p>As a token of our appreciation, here's a 10% discount code for your next order: THANKYOU10</p>
        <p>We look forward to serving you again soon!</p>
        <p>Best regards,</p>
        <p>The {{restaurantName}} Team</p>
      `,
  },
  {
    name: "Special Offer",
    content: `
        <p>Hello {{customerName}},</p>
        <p>As a valued customer, we're excited to offer you an exclusive deal!</p>
        <p>For the next 7 days, enjoy 20% off your next order with code: SPECIAL20</p>
        <p>Here are some of our current favorites you might enjoy:</p>
        <ul>
          <li>Signature Dish - $15.99</li>
          <li>Chef's Special - $12.99</li>
          <li>Seasonal Delight - $10.99</li>
        </ul>
        <p>This offer is our way of saying thank you for your continued support. We look forward to serving you again soon!</p>
        <p>Warm regards,</p>
        <p>The {{restaurantName}} Team</p>
      `,
  },
  {
    name: "Order Follow-Up",
    content: `
        <p>Dear {{customerName}},</p>
        <p>We hope you're enjoying your recent order from {{restaurantName}}! We wanted to check in and make sure everything was to your satisfaction.</p>
        <p>If you experienced any issues or have any feedback, please don't hesitate to reply to this email. Your satisfaction is our top priority!</p>
        <p>As a thank you for being a valued customer, here's a special offer for your next order:</p>
        <p>Use code FOLLOWUP15 for 15% off your next purchase within the next 14 days.</p>
        <p>We look forward to serving you again soon!</p>
        <p>Best regards,</p>
        <p>The {{restaurantName}} Team</p>
      `,
  },
  {
    name: "Loyalty Reward",
    content: `
        <p>Hi {{customerName}},</p>
        <p>We noticed you've been a loyal customer of {{restaurantName}}, and we wanted to say thank you!</p>
        <p>As a token of our appreciation, we're excited to offer you:</p>
        <ul>
          <li>A free dessert on your next order</li>
          <li>15% off your next purchase with code: LOYAL15</li>
          <li>Exclusive early access to our new menu items</li>
        </ul>
        <p>We truly value your continued support and look forward to serving you again soon!</p>
        <p>Warm regards,</p>
        <p>The {{restaurantName}} Team</p>
      `,
  },
];
