import { useState, useCallback, useEffect } from "react";

import "./App.css";
import Editor from "./components/ui/lexical/Editor";
import { $isElementNode, LexicalEditor, LexicalNode } from "lexical";

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
import { FileText, Send, Loader2 } from "lucide-react";
import { fetchOrders, fetchOrderDetails, Order } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

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
const BACKEND_API_URL = "http://localhost:3001/api";

function App() {
  const [editor, setEditor] = useState<LexicalEditor | null>(null);
  const [previewContent, setPreviewContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [emailContent, setEmailContent] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const data = await fetchOrders();
        setOrders(data);
        if (data.length > 0) {
          setSelectedOrder(data[0]);
        }
      } catch (error) {
        console.error("Failed to load orders:", error);
      }
    };
    loadOrders();
  }, []);

  const handleOrderSelect = async (orderId: string) => {
    try {
      const order = await fetchOrderDetails(orderId);
      setSelectedOrder(order);
    } catch (error) {
      console.error("Failed to load order details:", error);
    }
  };

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
        setEmailContent(content);
        setPreviewContent(getPreview(content));
      });
    }
  };

  const generateAIMessage = useCallback(
    async (prompt: string) => {
      if (!prompt.trim()) return;

      setIsGenerating(true);
      try {
        const orderDetails = {
          customerName: "John Doe",
          orderId: "#123456",
          orderedItems: ORDERED_ITEMS.map(
            (item) => `${item.name} x${item.quantity}`
          ).join(", "),
          total: "$45.67",
          customerReview:
            "The food was delicious, but delivery took longer than expected.",
        };

        const response = await fetch(`${BACKEND_API_URL}/generate-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            variables: TEMPLATE_VARIABLES,
            orderDetails,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate message");
        }

        if (editor) {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
          });
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Failed to read stream");
        }

        let accumulatedContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = new TextDecoder().decode(value);
          const lines = text.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const json = line.slice(6);
              if (json === "[DONE]") break;

              const data = JSON.parse(json);
              const content = data.content;

              if (content) {
                accumulatedContent += content;

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
                  accumulatedContent = "";
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
    },
    [editor]
  );

  const handleSendEmail = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Email Sent",
        description:
          "The email has been successfully sent to the customer (not really).",
      });
    }, 1500); // Simulate a 1.5 second delay
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-8">
        <div className="w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Past Orders</CardTitle>
              <CardDescription>Recent customer orders</CardDescription>
            </CardHeader>
            <div className="p-4 space-y-2">
              {orders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => handleOrderSelect(order.id)}
                  className={`w-full text-left p-2 rounded-md hover:bg-gray-100 ${
                    selectedOrder?.id === order.id ? "bg-gray-100" : ""
                  }`}
                >
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-sm text-gray-500">
                    #{order.id.slice(0, 8)} - ${order.total.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex-1">
          {selectedOrder && (
            <Card className="mb-10">
              <CardHeader>
                <CardTitle>Order Details</CardTitle>
                <CardDescription>
                  Information about the recent order
                </CardDescription>
              </CardHeader>
              <div className="p-6 pt-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order ID</p>
                  <p className="font-medium">#{selectedOrder.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Customer Name</p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Total</p>
                  <p className="font-medium">
                    ${selectedOrder.total.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Rating</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">
                            {(
                              selectedOrder.ratings.reduce(
                                (sum, r) => sum + r.rating,
                                0
                              ) / selectedOrder.ratings.length
                            ).toFixed(1)}
                          </span>
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm text-muted-foreground">
                            (based on {selectedOrder.ratings.length} criteria)
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="space-y-2">
                        {selectedOrder.ratings.map((criteria, index) => (
                          <div
                            key={index}
                            className="flex justify-between gap-4"
                          >
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
                <p className="text-sm text-muted-foreground mb-2">
                  Ordered Items
                </p>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          x{item.quantity}
                        </span>
                      </div>
                      <span className="font-medium">
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOrder.review && (
                <div className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    Customer Review
                  </p>
                  <blockquote className="pl-4 border-l-2 border-muted">
                    "{selectedOrder.review}"
                  </blockquote>
                </div>
              )}
            </Card>
          )}

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
                          generateAIMessage(prompt);
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
                <div className="text-xl font-semibold min-h-20 flex-shrink-0 flex items-end justify-end">
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
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleSendEmail}
                className="w-48"
                disabled={isSending || !emailContent.trim()}
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 mr-2" />
                )}
                {isSending ? "Sending..." : "Send Email"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
