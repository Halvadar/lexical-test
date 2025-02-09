import { useState } from "react";

import "./App.css";
import Editor from "./components/ui/lexical/Editor";
import { LexicalEditor } from "lexical";
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

// Define available variables
const TEMPLATE_VARIABLES = [
  { key: "customerName", label: "Customer Name", example: "John Doe" },
  {
    key: "customerEmail",
    label: "Customer Email",
    example: "john@example.com",
  },
  { key: "mealName", label: "Meal Name", example: "Spicy Chicken Bowl" },
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

function App() {
  const [editor, setEditor] = useState<LexicalEditor | null>(null);
  const [previewContent, setPreviewContent] = useState("");

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
            <div className="min-h-20 flex flex-col justify-end ">
              <p className="text-sm text-gray-600 mb-2">Insert Variables:</p>
              <div className="flex gap-2 flex-wrap">
                {TEMPLATE_VARIABLES.map(({ key, label }) => (
                  <Button
                    key={key}
                    onClick={() => insertVariable(key)}
                    variant="outline"
                    size="sm"
                    className="text-nowrap"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>
            <Card className="flex-grow">
              <Editor onEditorReady={setEditor} onChange={updatePreview} />
            </Card>
          </div>
          <div className="flex gap-4 flex-col flex-grow flex-shrink-0 basis-[calc(50%-1rem)] max-w-full min-w-[300px] min-h-[300px]">
            <div className="text-xl font-semibold min-h-20  flex-shrink-0 flex items-end">
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
