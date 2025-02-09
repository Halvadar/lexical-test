import { useState } from "react";

import "./App.css";
import Editor from "./components/ui/lexical/Editor";

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

const DEFAULT_TEMPLATE = `Dear {{customerName}},

Thank you for ordering {{mealName}} from our restaurant! We hope you enjoyed your meal.

Please let us know if there's anything we can do to serve you better next time.

Best regards,
Your Restaurant Team`;

function App() {
  const [html, setHtml] = useState(DEFAULT_TEMPLATE);

  function insertVariable(variable: string) {
    setHtml((current) => current + `{{${variable}}}`);
  }

  function getPreview() {
    let preview = html;
    TEMPLATE_VARIABLES.forEach(({ key, example }) => {
      preview = preview.replace(new RegExp(`{{${key}}}`, "g"), example);
    });
    return preview;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Email Template Editor</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="editor-section">
          <h2 className="text-xl font-semibold mb-4">Edit Template</h2>
          <div className="variables-section mb-4">
            <p className="text-sm text-gray-600 mb-2">Insert Variables:</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATE_VARIABLES.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => insertVariable(key)}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="">
            <Editor />
          </div>
        </div>

        <div className="preview-section">
          <h2 className="text-xl font-semibold mb-4">Preview</h2>
          <div
            className="preview-container p-4 border rounded-lg bg-white"
            dangerouslySetInnerHTML={{ __html: getPreview() }}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
