/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  UndoIcon,
  RedoIcon,
  BoldIcon,
  UnderlineIcon,
  StrikethroughIcon,
  AlignLeftIcon,
  AlignCenterIcon,
  AlignRightIcon,
  ItalicIcon,
  ListIcon,
  ListOrderedIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  $insertList,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from "@lexical/list";
const LowPriority = 1;

function Divider() {
  return <div className="divider" />;
}

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const toolbarRef = useRef(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);

  const $updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat("bold"));
      setIsItalic(selection.hasFormat("italic"));
      setIsUnderline(selection.hasFormat("underline"));
      setIsStrikethrough(selection.hasFormat("strikethrough"));
    }
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          $updateToolbar();
        });
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        (_payload, _newEditor) => {
          $updateToolbar();
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (payload) => {
          setCanUndo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (payload) => {
          setCanRedo(payload);
          return false;
        },
        LowPriority
      ),
      editor.registerCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        () => {
          $insertList("bullet");
          return true;
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        INSERT_ORDERED_LIST_COMMAND,
        () => {
          $insertList("number");
          return true;
        },
        COMMAND_PRIORITY_LOW
      )
    );
  }, [editor, $updateToolbar]);

  return (
    <div className="toolbar" ref={toolbarRef}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled={!canUndo}
              onClick={() => {
                editor.dispatchCommand(UNDO_COMMAND, undefined);
              }}
              className="toolbar-item spaced"
              aria-label="Undo"
            >
              <UndoIcon className={`w-4 h-4 ${!canUndo ? "opacity-30" : ""}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              disabled={!canRedo}
              onClick={() => {
                editor.dispatchCommand(REDO_COMMAND, undefined);
              }}
              className="toolbar-item"
              aria-label="Redo"
            >
              <RedoIcon className={`w-4 h-4 ${!canRedo ? "opacity-30" : ""}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo</p>
          </TooltipContent>
        </Tooltip>

        <Divider />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
              }}
              className={"toolbar-item spaced " + (isBold ? "active" : "")}
              aria-label="Format Bold"
            >
              <BoldIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Bold</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
              }}
              className={"toolbar-item spaced " + (isItalic ? "active" : "")}
              aria-label="Format Italics"
            >
              <ItalicIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Italic</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
              }}
              className={"toolbar-item spaced " + (isUnderline ? "active" : "")}
              aria-label="Format Underline"
            >
              <UnderlineIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Underline</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough");
              }}
              className={
                "toolbar-item spaced " + (isStrikethrough ? "active" : "")
              }
              aria-label="Format Strikethrough"
            >
              <StrikethroughIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Strikethrough</p>
          </TooltipContent>
        </Tooltip>

        <Divider />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(
                  INSERT_UNORDERED_LIST_COMMAND,
                  undefined
                );
              }}
              className="toolbar-item spaced"
              aria-label="Insert Unordered List"
            >
              <ListIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Unordered List</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
              }}
              className="toolbar-item spaced"
              aria-label="Insert Ordered List"
            >
              <ListOrderedIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ordered List</p>
          </TooltipContent>
        </Tooltip>
        <Divider />

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "left");
              }}
              className="toolbar-item spaced"
              aria-label="Left Align"
            >
              <AlignLeftIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Left Align</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "center");
              }}
              className="toolbar-item spaced"
              aria-label="Center Align"
            >
              <AlignCenterIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Center Align</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => {
                editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, "right");
              }}
              className="toolbar-item spaced"
              aria-label="Right Align"
            >
              <AlignRightIcon className="w-4 h-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Right Align</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
