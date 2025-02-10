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
import { FileText, Send, Loader2, Menu } from "lucide-react";
import { fetchOrders, fetchOrderDetails, Order } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { $createListNode, $createListItemNode } from "@lexical/list";

// Define available variables
const TEMPLATE_VARIABLES_SAMPLE = [
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
];

// Add these constants for templates and AI options
const MESSAGE_TEMPLATES = [
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

// Add OpenAI API endpoint
const BACKEND_API_URL = "http://localhost:3001/api";

// Add this helper function to convert HTML to Lexical nodes
const convertHtmlToLexicalNodes = (html: string): LexicalNode[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const nodes: LexicalNode[] = [];

  const convertNode = (node: Node): LexicalNode | null => {
    if (node.nodeType === Node.TEXT_NODE) {
      return $createTextNode(node.textContent || "");
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      switch (element.tagName) {
        case "P": {
          const paragraph = $createParagraphNode();
          Array.from(element.childNodes).forEach((child) => {
            const childNode = convertNode(child);
            if (childNode) {
              paragraph.append(childNode);
            }
          });
          return paragraph;
        }
        case "UL":
        case "OL": {
          const list = $createListNode(
            element.tagName === "UL" ? "bullet" : "number"
          );
          Array.from(element.children).forEach((li) => {
            const listItem = $createListItemNode();
            Array.from(li.childNodes).forEach((child) => {
              const childNode = convertNode(child);
              if (childNode) {
                listItem.append(childNode);
              }
            });
            list.append(listItem);
          });
          return list;
        }
        case "LI": {
          const listItem = $createListItemNode();
          Array.from(element.childNodes).forEach((child) => {
            const childNode = convertNode(child);
            if (childNode) {
              listItem.append(childNode);
            }
          });
          return listItem;
        }
        case "STRONG":
        case "B": {
          const boldText = $createTextNode(element.textContent || "");
          boldText.toggleFormat("bold");
          return boldText;
        }
        case "EM":
        case "I": {
          const italicText = $createTextNode(element.textContent || "");
          italicText.toggleFormat("italic");
          return italicText;
        }
        case "U": {
          const underlineText = $createTextNode(element.textContent || "");
          underlineText.toggleFormat("underline");
          return underlineText;
        }
        default:
          return $createTextNode(element.textContent || "");
      }
    }
    return null;
  };

  Array.from(doc.body.childNodes).forEach((node) => {
    const lexicalNode = convertNode(node);
    if (lexicalNode) {
      nodes.push(lexicalNode);
    }
  });

  return nodes;
};

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

      // Clear the editor
      if (editor) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }
      setPreviewContent("");
      setEmailContent("");
    } catch (error) {
      console.error("Failed to load order details:", error);
    }
  };

  function getPreview(content: string) {
    let preview = content;
    Object.entries(selectedOrder || {}).forEach(([key, value]) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, "g"), () => {
        if (Array.isArray(value)) {
          return `<ul class="editor-list-ul">
              ${value
                .map(
                  (item) =>
                    `<li class="editor-listitem">${item.name} x${item.quantity} ${item.price}</li>`
                )
                .join("")}
            </ul>`;
        }
        return value;
      });
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
          customerName: selectedOrder?.customerName || "John Doe",
          orderId: selectedOrder?.orderId || "#123456",
          orderedItems: selectedOrder?.orderedItems
            .map((item) => `${item.name} x${item.quantity}`)
            .join(", "),
          total: selectedOrder?.total.toFixed(2) || "$45.67",
          customerReview: selectedOrder?.customerReview || "",
        };

        const response = await fetch(`${BACKEND_API_URL}/generate-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt,
            variables: TEMPLATE_VARIABLES_SAMPLE,
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
    [editor, selectedOrder]
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

      // Clear the editor after sending
      if (editor) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }
      setPreviewContent("");
      setEmailContent("");
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="mb-4">
                <Menu className="w-4 h-4 mr-2" />
                Orders
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <Card className="border-none shadow-none">
                <CardHeader>
                  <CardTitle>Past Orders</CardTitle>
                  <CardDescription>Recent customer orders</CardDescription>
                </CardHeader>
                <div className="p-4 space-y-2">
                  {orders.map((order) => (
                    <button
                      key={order.orderId}
                      onClick={() => {
                        handleOrderSelect(order.orderId);
                        document.dispatchEvent(new Event("sheet.close"));
                      }}
                      className={`w-full text-left p-2 rounded-md hover:bg-gray-100 ${
                        selectedOrder?.orderId === order.orderId
                          ? "bg-gray-100"
                          : ""
                      }`}
                    >
                      <div className="font-medium">{order.customerName}</div>
                      <div className="text-sm text-gray-500">
                        #{order.orderId.slice(0, 8)} - ${order.total.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-80 flex-shrink-0">
          <Card>
            <CardHeader>
              <CardTitle>Past Orders</CardTitle>
              <CardDescription>Recent customer orders</CardDescription>
            </CardHeader>
            <div className="p-4 space-y-2">
              {orders.map((order) => (
                <button
                  key={order.orderId}
                  onClick={() => handleOrderSelect(order.orderId)}
                  className={`w-full text-left p-2 rounded-md hover:bg-gray-100 ${
                    selectedOrder?.orderId === order.orderId
                      ? "bg-gray-100"
                      : ""
                  }`}
                >
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-sm text-gray-500">
                    #{order.orderId.slice(0, 8)} - ${order.total.toFixed(2)}
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content */}
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
                  <p className="font-medium">
                    #{selectedOrder.orderId.slice(0, 8)}
                  </p>
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
                  {selectedOrder.orderedItems.map((item, index) => (
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
              {selectedOrder.customerReview && (
                <div className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground mb-2">
                    Customer Review
                  </p>
                  <blockquote className="pl-4 border-l-2 border-muted">
                    "{selectedOrder.customerReview}"
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

                                    // Convert HTML to Lexical nodes
                                    const nodes = convertHtmlToLexicalNodes(
                                      template.content
                                    );

                                    // Append all nodes to the root
                                    nodes.forEach((node) => {
                                      if ($isElementNode(node)) {
                                        root.append(node);
                                      }
                                    });
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
                    templateVariables={TEMPLATE_VARIABLES_SAMPLE.filter(
                      (variable) =>
                        Object.keys(selectedOrder || {}).includes(variable.key)
                    )}
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
