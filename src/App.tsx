import { useState, useCallback, useEffect } from "react";

import "./App.css";

import { $isElementNode, LexicalEditor, LexicalNode } from "lexical";

import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";

import { fetchOrders, fetchOrderDetails, Order } from "@/services/api";
import { useToast } from "@/hooks/use-toast";

import { OrderSidebar } from "@/components/OrderSidebar";
import { OrderDetails } from "@/components/OrderDetails";
import { EmailEditor } from "@/components/EmailEditor";
import { TEMPLATE_VARIABLES_SAMPLE } from "./types/editorTypes";

// Define available variables

// Add OpenAI API endpoint
const BACKEND_API_URL = "http://localhost:3001/api";

function App() {
  const [editor, setEditor] = useState<LexicalEditor | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

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

      // Clear the editor content
      if (editor) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }
    } catch (error) {
      console.error("Failed to load order details:", error);
    }
  };

  const handleSendEmail = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      toast({
        title: "Email Sent",
        description:
          "The email has been successfully sent to the customer (not really).",
      });

      // Clear the editor content after sending
      if (editor) {
        editor.update(() => {
          const root = $getRoot();
          root.clear();
        });
      }
    }, 1500);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <OrderSidebar
          orders={orders}
          selectedOrderId={selectedOrder?.orderId || null}
          onOrderSelect={handleOrderSelect}
        />

        <div className="flex-1">
          {selectedOrder && (
            <>
              <OrderDetails order={selectedOrder} />
              <EmailEditor
                onSend={handleSendEmail}
                isSending={isSending}
                selectedOrder={selectedOrder}
                onGenerate={generateAIMessage}
                isGenerating={isGenerating}
                setEditor={setEditor}
                editor={editor}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
