/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import {
  $isTextNode,
  DOMConversionMap,
  DOMExportOutput,
  DOMExportOutputMap,
  isHTMLElement,
  Klass,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  TextNode,
} from "lexical";
import { ListItemNode, ListNode } from "@lexical/list";
import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import ExampleTheme from "./exampleTheme";
import ToolbarPlugin from "./plugins/ToolbarPlugin";
import { parseAllowedColor, parseAllowedFontSize } from "./styleConfig";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import VariablePlugin from "./plugins/VariablePlugin";
import { INSERT_VARIABLE_COMMAND } from "./commands";

const placeholder = "Write your email here...";

const removeStylesExportDOM = (
  editor: LexicalEditor,
  target: LexicalNode
): DOMExportOutput => {
  const output = target.exportDOM(editor);
  if (output && isHTMLElement(output.element)) {
    // Remove all inline styles and classes if the element is an HTMLElement
    // Children are checked as well since TextNode can be nested
    // in i, b, and strong tags.
    for (const el of [
      output.element,
      ...output.element.querySelectorAll('[style],[class],[dir="ltr"]'),
    ]) {
      el.removeAttribute("class");
      el.removeAttribute("style");
      if (el.getAttribute("dir") === "ltr") {
        el.removeAttribute("dir");
      }
    }
  }
  return output;
};

const exportMap: DOMExportOutputMap = new Map<
  Klass<LexicalNode>,
  (editor: LexicalEditor, target: LexicalNode) => DOMExportOutput
>([
  [ParagraphNode, removeStylesExportDOM],
  [TextNode, removeStylesExportDOM],
]);

const getExtraStyles = (element: HTMLElement): string => {
  // Parse styles from pasted input, but only if they match exactly the
  // sort of styles that would be produced by exportDOM
  let extraStyles = "";
  const fontSize = parseAllowedFontSize(element.style.fontSize);
  const backgroundColor = parseAllowedColor(element.style.backgroundColor);
  const color = parseAllowedColor(element.style.color);
  if (fontSize !== "" && fontSize !== "15px") {
    extraStyles += `font-size: ${fontSize};`;
  }
  if (backgroundColor !== "" && backgroundColor !== "rgb(255, 255, 255)") {
    extraStyles += `background-color: ${backgroundColor};`;
  }
  if (color !== "" && color !== "rgb(0, 0, 0)") {
    extraStyles += `color: ${color};`;
  }
  return extraStyles;
};

const constructImportMap = (): DOMConversionMap => {
  const importMap: DOMConversionMap = {};

  // Wrap all TextNode importers with a function that also imports
  // the custom styles implemented by the playground
  for (const [tag, fn] of Object.entries(TextNode.importDOM() || {})) {
    importMap[tag] = (importNode) => {
      const importer = fn(importNode);
      if (!importer) {
        return null;
      }
      return {
        ...importer,
        conversion: (element) => {
          const output = importer.conversion(element);
          if (
            output === null ||
            output.forChild === undefined ||
            output.after !== undefined ||
            output.node !== null
          ) {
            return output;
          }
          const extraStyles = getExtraStyles(element);
          if (extraStyles) {
            const { forChild } = output;
            return {
              ...output,
              forChild: (child, parent) => {
                const textNode = forChild(child, parent);
                if ($isTextNode(textNode)) {
                  textNode.setStyle(textNode.getStyle() + extraStyles);
                }
                return textNode;
              },
            };
          }
          return output;
        },
      };
    };
  }

  return importMap;
};

const editorConfig = {
  html: {
    export: exportMap,
    import: constructImportMap(),
  },
  namespace: "React.js Demo",
  nodes: [ParagraphNode, TextNode, ListNode, ListItemNode],
  onError(error: Error) {
    throw error;
  },
  theme: ExampleTheme,
};

interface EditorProps {
  onEditorReady?: (editor: LexicalEditor) => void;
  onChange?: () => void;
  templateVariables: { key: string; label: string }[];
}

export default function Editor({
  onEditorReady,
  onChange,
  templateVariables,
}: EditorProps) {
  return (
    <LexicalComposer initialConfig={editorConfig}>
      <EditorContent
        onEditorReady={onEditorReady}
        onChange={onChange}
        templateVariables={templateVariables}
      />
    </LexicalComposer>
  );
}

function EditorContent({
  onEditorReady,
  onChange,
  templateVariables,
}: {
  onEditorReady?: (editor: LexicalEditor) => void;
  onChange?: () => void;
  templateVariables: { key: string; label: string }[];
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Add this function to insert variables
  const insertVariable = (variable: string) => {
    editor.dispatchCommand(INSERT_VARIABLE_COMMAND, `{{${variable}}}`);
  };

  return (
    <div className="editor-container">
      <ToolbarPlugin />
      <div className="flex items-center gap-2 p-2 border-b">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Insert Variable
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {templateVariables.map(({ key, label }) => (
              <DropdownMenuItem key={key} onClick={() => insertVariable(key)}>
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="editor-inner">
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="editor-input"
              aria-placeholder={placeholder}
              placeholder={
                <div className="editor-placeholder">{placeholder}</div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <HistoryPlugin />
        <VariablePlugin />
        {onChange && <OnChangePlugin onChange={onChange} />}
      </div>
    </div>
  );
}
