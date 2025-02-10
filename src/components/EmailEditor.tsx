import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Send, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AIGeneratorDialog } from "@/components/AIDialog";
import Editor from "@/components/lexical/Editor";
import {
  LexicalEditor,
  $getRoot,
  $isElementNode,
  $createTextNode,
  LexicalNode,
  $createParagraphNode,
} from "lexical";
import { Order } from "../services/api";
import { $createListItemNode } from "@lexical/list";
import { $createListNode } from "@lexical/list";
import {
  MESSAGE_TEMPLATES,
  TEMPLATE_VARIABLES_SAMPLE,
} from "../types/editorTypes";

const convertHtmlToLexicalNodes = (html: string): LexicalNode[] => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const nodes: LexicalNode[] = [];
  Array.from(tempDiv.childNodes).forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      nodes.push($createTextNode(node.textContent || ""));
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;
      if (element.tagName === "P") {
        const paragraph = $createParagraphNode();
        paragraph.append($createTextNode(element.textContent || ""));
        nodes.push(paragraph);
      } else if (element.tagName === "UL" || element.tagName === "OL") {
        const list = $createListNode(
          element.tagName === "UL" ? "bullet" : "number"
        );
        Array.from(element.children).forEach((li) => {
          const listItem = $createListItemNode();
          listItem.append($createTextNode(li.textContent || ""));
          list.append(listItem);
        });
        nodes.push(list);
      }
    }
  });

  return nodes;
};

interface EmailEditorProps {
  onSend: () => void;
  isSending: boolean;
  selectedOrder: Order;
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
  editor: LexicalEditor | null;
  setEditor: (editor: LexicalEditor | null) => void;
}

export function EmailEditor({
  onSend,
  isSending,
  selectedOrder,
  onGenerate,
  isGenerating,
  editor,
  setEditor,
}: EmailEditorProps) {
  const [previewContent, setPreviewContent] = useState("");

  const updatePreview = () => {
    if (editor) {
      editor.getEditorState().read(() => {
        const content = editor.getRootElement()?.innerHTML || "";
        setPreviewContent(getPreview(content));
      });
    }
  };

  const getPreview = useCallback(
    (content: string) => {
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
    },
    [selectedOrder]
  );

  useEffect(() => {
    if (!editor) return;

    const updatePreview = () => {
      editor.getEditorState().read(() => {
        const content = editor.getRootElement()?.innerHTML || "";
        setPreviewContent(getPreview(content));
      });
    };

    // Subscribe to editor changes
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        if (root.isEmpty()) {
          setPreviewContent("");
        } else {
          updatePreview();
        }
      });
    });

    return () => {
      unregister();
    };
  }, [editor, getPreview]);

  return (
    <div className="editor-section">
      <Card>
        <div className="p-6 pb-4">
          <h1 className="text-2xl font-bold">Email Template Editor</h1>
        </div>
        <div className="flex gap-4 flex-wrap items-stretch px-6 pb-6">
          <div className="flex gap-4 flex-col flex-grow flex-shrink-0 basis-[calc(50%-1rem)] max-w-full min-w-[300px] min-h-[400px]">
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
                          className="cursor-pointer"
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
                      onGenerate(prompt);
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
          <div className="flex gap-4 flex-col flex-grow flex-shrink-0 basis-[calc(50%-1rem)] max-w-full min-w-[300px] min-h-[400px]">
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
        <div className="flex justify-end p-6 pt-0">
          <Button
            onClick={onSend}
            className="w-48"
            disabled={isSending || !previewContent.trim()}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
