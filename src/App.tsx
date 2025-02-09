import { useState } from "react";

import "./App.css";
import Editor from "./components/ui/lexical/Editor";
import { LexicalEditor } from "lexical";
import { INSERT_VARIABLE_COMMAND } from "./components/ui/lexical/commands";
import { Card } from "./components/ui/card";

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
      <h1 className="text-2xl font-bold mb-6">Email Template Editor</h1>

      <div className="editor-section">
        <div className="flex gap-4 flex-wrap items-stretch">
          <div className="flex gap-4 flex-col flex-grow flex-shrink-0 basis-[calc(50%-1rem)] max-w-full min-w-[300px] min-h-[300px]">
            <div className=" lg:min-h-28 md:min-h-40 min-h-20 flex flex-col justify-end ">
              <h2 className="text-xl font-semibold mb-4">Edit Template</h2>
              <p className="text-sm text-gray-600 mb-2">Insert Variables:</p>
              <div className="flex gap-2 flex-wrap">
                {TEMPLATE_VARIABLES.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => insertVariable(key)}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm text-nowrap"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <Card className="flex-grow">
              <Editor onEditorReady={setEditor} onChange={updatePreview} />
            </Card>
          </div>
          <div className="flex gap-4 flex-col flex-grow flex-shrink-0 basis-[calc(50%-1rem)] max-w-full min-w-[300px] min-h-[300px]">
            <div className="text-xl font-semibold lg:min-h-28 md:min-h-40 min-h-20  flex-shrink-0 flex items-end">
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
