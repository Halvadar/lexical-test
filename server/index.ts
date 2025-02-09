import * as express from "express";
import * as cors from "cors";
import { config } from "dotenv";
import { OpenAI } from "openai";

config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/api/generate-email", async (req, res) => {
  try {
    const { prompt, variables, orderDetails } = req.body;

    const contextMessage = `
      You are helping a restaurant owner write an email to a customer.
      Here are the order details:
      - Customer Name: ${orderDetails.customerName}
      - Order ID: ${orderDetails.orderId}
      - Ordered Items: ${orderDetails.orderedItems}
      - Total: ${orderDetails.total}
      - Customer Review: "${orderDetails.customerReview}"
      
      The restaurant owner has provided this prompt: "${prompt}"
      
      You can use the following variables in your message:
      ${variables
        .map(({ key, example }) => `- {{${key}}} (Example: ${example})`)
        .join("\n")}

      Don't add subject line to the email.
      The message should be formatted in HTML. This is an example of the HTML format:
      <p>Dear {{customerName}},</p>
      <p>Thank you for your order of {{mealName}}!</p>
      <p>We hope you enjoy your meal. If you have any questions, please don't hesitate to contact us.</p>
      <p>Best regards,</p>
      <p>{{restaurantName}}</p>

      Please generate a professional and friendly email message based on this information.
    `;

    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant that helps restaurant owners write professional emails to their customers.",
        },
        {
          role: "user",
          content: contextMessage,
        },
      ],
      stream: true,
      temperature: 0.7,
      max_tokens: 200,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Error generating email:", error);
    res.status(500).json({ error: "Failed to generate email" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
