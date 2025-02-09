import { useState, useCallback } from "react";

import "./App.css";
import Editor from "./components/ui/lexical/Editor";
import {
  $isElementNode,
  $isParagraphNode,
  LexicalEditor,
  LexicalNode,
} from "lexical";
import { INSERT_VARIABLE_COMMAND } from "@/components/ui/lexical/commands";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import { AIGeneratorDialog } from "@/components/ui/ai-generator-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText } from "lucide-react";

// Define available variables
const TEMPLATE_VARIABLES = [
  { key: "customerName", label: "Customer Name", example: "John Doe" },
  {
    key: "customerEmail",
    label: "Customer Email",
    example: "john@example.com",
  },
  { key: "mealName", label: "Meal Name", example: "Spicy Chicken Bowl" },
  { key: "orderId", label: "Order ID", example: "#123456" },
  {
    key: "orderedItems",
    label: "Ordered Items",
    example: "Spicy Chicken Bowl, Vegetable Spring Rolls, Green Tea",
  },
  { key: "total", label: "Total", example: "$45.67" },
  {
    key: "customerReview",
    label: "Customer Review",
    example: "The food was delicious, but delivery took longer than expected.",
  },
  { key: "restaurantName", label: "Restaurant Name", example: "Saffron Grill" },
];

// Add this constant for ordered items
const ORDERED_ITEMS = [
  { name: "Spicy Chicken Bowl", quantity: 1, price: 12.99 },
  { name: "Vegetable Spring Rolls", quantity: 2, price: 5.99 },
  { name: "Green Tea", quantity: 1, price: 2.99 },
];

// Add this constant for rating criteria
const RATING_CRITERIA = [
  { criterion: "Food Quality", rating: 4.8 },
  { criterion: "Delivery Time", rating: 3.9 },
  { criterion: "Packaging", rating: 4.5 },
];

// Add these constants for templates and AI options
const MESSAGE_TEMPLATES = [
  {
    name: "Thank You",
    content: "Dear {{customerName}}, thank you for your order of {{mealName}}!",
  },
  {
    name: "Feedback Request",
    content:
      "Hi {{customerName}}, we'd love your feedback on your recent order of {{mealName}}!",
  },
  {
    name: "Special Offer",
    content:
      "Hello {{customerName}}, as a valued customer, here's a special offer for your next order!",
  },
];

// Add OpenAI API endpoint
const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

function App() {
  const [editor, setEditor] = useState<LexicalEditor | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  function insertVariable(variable: string) {
    if (editor) {
      editor.dispatchCommand(INSERT_VARIABLE_COMMAND, `{{${variable}}}`);
    }
  }

  function getPreview(content: string) {
    let preview = content;
    TEMPLATE_VARIABLES.forEach(({ key, example }) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, "g"), example);
    });
    return preview;
  }

  const updatePreview = () => {
    if (editor) {
      editor.getEditorState().read(() => {
        const content = editor.getRootElement()?.innerHTML || "";
        setPreviewContent(getPreview(content));
      });
    }
  };

  const generateAIMessage = useCallback(async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    try {
      // Create context message with order details
      const contextMessage = `
        You are helping a restaurant owner write an email to a customer.
        Here are the order details:
        - Customer Name: John Doe
        - Order ID: #123456
        - Ordered Items: ${ORDERED_ITEMS.map(
          (item) => `${item.name} x${item.quantity}`
        ).join(", ")}
        - Total: $45.67
        - Customer Review: "The food was delicious, but delivery took longer than expected."
        
        The restaurant owner has provided this prompt: "${aiPrompt}"
        
        You can use the following variables in your message:
        ${TEMPLATE_VARIABLES.map(
          ({ key, example }) => `- {{${key}}} (Example: ${example})`
        ).join("\n")}

        Don't add subject line to the email.
        The message should be formatted in HTML. This is an example of the HTML format:
        <p>Dear {{customerName}},</p>
        <p>Thank you for your order of {{mealName}}!</p>
        <p>We hope you enjoy your meal. If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,</p>
        <p>{{restaurantName}}</p>

        Please generate a professional and friendly email message based on this information.
      `;

      const response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate message");
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to read stream");
      }

      if (editor) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }

      let accumulatedContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = new TextDecoder().decode(value);
        const lines = text.split("\n");

        console.log("lines", lines);
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const json = line.slice(6);
            if (json === "[DONE]") break;

            const data = JSON.parse(json);
            const content = data.choices[0]?.delta?.content;

            if (content) {
              accumulatedContent += content;

              // Only update the editor when we have complete paragraph tags
              if (accumulatedContent.includes("</p>")) {
                if (editor) {
                  editor.update(() => {
                    const root = $getRoot();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(
                      accumulatedContent,
                      "text/html"
                    );

                    // Convert HTML nodes to Lexical nodes
                    const convertNode = (node: Node): LexicalNode | null => {
                      if (node.nodeType === Node.TEXT_NODE) {
                        return $createTextNode(node.textContent || "");
                      } else if (node.nodeType === Node.ELEMENT_NODE) {
                        const element = node as HTMLElement;
                        if (element.tagName === "P") {
                          const paragraph = $createParagraphNode();
                          Array.from(element.childNodes).forEach((child) => {
                            const childNode = convertNode(child);
                            if (childNode) {
                              paragraph.append(childNode);
                            }
                          });
                          return paragraph;
                        }
                      }
                      return null;
                    };

                    Array.from(doc.body.childNodes).forEach((node) => {
                      const lexicalNode = convertNode(node);
                      if (lexicalNode && $isElementNode(lexicalNode)) {
                        root.append(lexicalNode);
                      }
                    });
                  });
                }
                accumulatedContent = ""; // Reset accumulated content
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error generating AI message:", error);
      alert("Failed to generate message. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [aiPrompt, editor]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Add Order Details title */}
      <h1 className="text-2xl font-bold mb-6">Order Details</h1>

      {/* Order Information Section */}
      <Card className="mb-10">
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>Information about the recent order</CardDescription>
        </CardHeader>
        <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Order ID</p>
            <p className="font-medium">#123456</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Customer Name</p>
            <p className="font-medium">John Doe</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Total</p>
            <p className="font-medium">$45.67</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Order Rating</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">4.5</span>
                    <span className="text-yellow-400">★</span>
                    <span className="text-sm text-muted-foreground">
                      (based on 3 criteria)
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent className="space-y-2">
                  {RATING_CRITERIA.map((criteria, index) => (
                    <div key={index} className="flex justify-between gap-4">
                      <span>{criteria.criterion}</span>
                      <span className="flex items-center gap-1">
                        {criteria.rating}
                        <span className="text-yellow-400">★</span>
                      </span>
                    </div>
                  ))}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <div className="p-6 pt-0">
          <p className="text-sm text-muted-foreground mb-2">Ordered Items</p>
          <div className="space-y-2">
            {ORDERED_ITEMS.map((item, index) => (
              <div key={index} className="flex justify-between">
                <div>
                  <span className="font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">
                    x{item.quantity}
                  </span>
                </div>
                <span className="font-medium">${item.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-6 pt-0">
          <p className="text-sm text-muted-foreground mb-2">Customer Review</p>
          <blockquote className="pl-4 border-l-2 border-muted">
            "The food was delicious, but delivery took longer than expected."
          </blockquote>
        </div>
      </Card>

      {/* Move Email Template Editor title here */}
      <div className="editor-section">
        <h1 className="text-2xl font-bold mb-6">Email Template Editor</h1>

        <div className="flex gap-4 flex-wrap items-stretch">
          <div className="flex gap-4 flex-col flex-grow flex-shrink-0 basis-[calc(50%-1rem)] max-w-full min-w-[300px] min-h-[300px]">
            <div className="min-h-20 flex flex-col justify-end">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Tools:</p>
                <div className="flex gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">
                        <FileText className="w-4 h-4 mr-2" />
                        Templates
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {MESSAGE_TEMPLATES.map((template, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={() => {
                            if (editor) {
                              editor.update(() => {
                                const root = $getRoot();
                                root.clear();
                                const paragraph = $createParagraphNode();
                                paragraph.append(
                                  $createTextNode(template.content)
                                );
                                root.append(paragraph);
                              });
                            }
                          }}
                        >
                          {template.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <AIGeneratorDialog
                    onGenerate={(prompt) => {
                      setAiPrompt(prompt);
                      generateAIMessage();
                    }}
                    isGenerating={isGenerating}
                  />
                </div>
              </div>
            </div>
            <Card className="flex-grow">
              <Editor
                onEditorReady={setEditor}
                onChange={updatePreview}
                templateVariables={TEMPLATE_VARIABLES}
              />
            </Card>
          </div>
          <div className="flex gap-4 flex-col flex-grow flex-shrink-0 basis-[calc(50%-1rem)] max-w-full min-w-[300px] min-h-[300px]">
            <div className="text-xl font-semibold min-h-20  flex-shrink-0 flex items-end justify-end">
              Preview
            </div>
            <Card className="flex-grow">
              <div
                className="p-4 h-full"
                dangerouslySetInnerHTML={{ __html: previewContent }}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
