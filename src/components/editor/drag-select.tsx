import React from "react";

import { Element, Location, Node, Range, Transforms } from "slate";
import { ReactEditor, useSlateStatic } from "slate-react";
import {
  copySelectedBlocks,
  deleteSelectedBlocks,
  deselectAll,
  deselectByPath,
  isSelectableElement,
  pasteBlocks,
  selectAll,
  selectByPath,
} from "./lib";

export interface DragSelectRef {
  onKey: (event: React.KeyboardEvent<HTMLDivElement>) => boolean;
  hasSelection: () => boolean;
  selectByMouseCoordinate: (x: number, y: number) => void;
}

export const DragSelect = React.forwardRef<DragSelectRef>((_, ref) => {
  const editor = useSlateStatic();

  const anchorRef = React.useRef({ x: 0, y: 0 });
  const focusRef = React.useRef({ x: 0, y: 0 });

  const [rect, setRect] = React.useState<DOMRect | null>(null);

  const calculateRect = React.useCallback(() => {
    const x = Math.min(anchorRef.current.x, focusRef.current.x);
    const y = Math.min(anchorRef.current.y, focusRef.current.y);

    const width = Math.max(anchorRef.current.x, focusRef.current.x) - x;
    const height = Math.max(anchorRef.current.y, focusRef.current.y) - y;
    return { x, y, width, height };
  }, []);

  const hasSelection = React.useCallback(() => {
    const nodes = editor.nodes({
      at: [],
      match: (n) =>
        Element.isElement(n) && isSelectableElement(n) && n.selected === true,
    });

    if (Array.from(nodes).length > 0) {
      return true;
    }
    return false;
  }, [editor]);

  // const { addVisualizer, clearVisualizers } = useDebugger()

  const selectByRect = React.useCallback(
    ({ x, y, width, height }: DOMRect) => {
      const nodes = Node.elements(editor);

      // clearVisualizers()

      for (let [node, path] of nodes) {
        if (!Element.isElement(node) || !isSelectableElement(node)) {
          continue;
        }

        const domNode = ReactEditor.toDOMNode(editor, node);
        if (domNode instanceof HTMLElement) {
          const rect = domNode.getBoundingClientRect();

          // relative to document
          rect.x += window.scrollX;
          rect.y += window.scrollY;

          if (node.type === "code") {
            // addVisualizer(rect, DebugColor.red)
          }

          // check if the node intersects with the rect
          if (
            rect.x < x + width &&
            rect.x + rect.width > x &&
            rect.y < y + height &&
            rect.y + rect.height > y
          ) {
            selectByPath(editor, path);
            continue;
          }
          deselectByPath(editor, path);
        }
      }
    },
    [editor],
  );

  const selectByMouseCoordinate = React.useCallback(
    (x: number, y: number) => {
      const nodes = Node.elements(editor);

      // set x to center of the editor
      const midX = window.innerWidth / 2;

      let minDistance = Infinity;
      let closestNode: Location = editor.end([]);

      for (let [node, path] of nodes) {
        const domNode = ReactEditor.toDOMNode(editor, node);
        if (domNode instanceof HTMLElement) {
          const rect = domNode.getBoundingClientRect();

          // relative to document
          rect.x += window.scrollX;
          rect.y += window.scrollY;

          // find distance from mouse to rect
          const distance = Math.sqrt(
            Math.pow(rect.x + rect.width / 2 - midX, 2) +
              Math.pow(rect.y + rect.height / 2 - y, 2),
          );

          const underElement = y - rect.bottom > 10;
          if (distance < minDistance) {
            minDistance = distance;
            closestNode =
              x > midX || underElement
                ? Range.end(editor.range(path))
                : Range.start(editor.range(path));
          }
        }
      }
      Transforms.select(editor, closestNode);
    },
    [editor],
  );

  const onMouseMove = React.useCallback(
    (event: MouseEvent) => {
      if (event.button === 0) {
        event.preventDefault();
        focusRef.current = { x: event.pageX, y: event.pageY };

        const { x, y, width, height } = calculateRect();
        const newRect = new DOMRect(x, y, width, height);
        setRect(newRect);
        selectByRect(newRect);
      }
    },
    [calculateRect, selectByRect],
  );

  const onMouseDown = React.useCallback(
    (event: MouseEvent) => {
      if (event.button === 0) {
        deselectAll(editor);
        if (event.target instanceof HTMLElement) {
          if (
            !event.target.isContentEditable &&
            event.target.tagName !== "INPUT"
          ) {
            event.preventDefault();
            Transforms.deselect(editor);
            anchorRef.current = { x: event.pageX, y: event.pageY };
            document.addEventListener("mousemove", onMouseMove);
          }
        }
      }
    },
    [editor, onMouseMove],
  );

  const onMouseUp = React.useCallback(
    (event: MouseEvent) => {
      if (event.button === 0) {
        event.preventDefault();
        setRect(null);
        if (hasSelection()) {
          Transforms.deselect(editor);
        }
        document.removeEventListener("mousemove", onMouseMove);
      }
    },
    [editor, hasSelection, onMouseMove],
  );

  const onPaste = React.useCallback(
    (event: ClipboardEvent) => {
      if (event.clipboardData) {
        if (pasteBlocks(editor, event.clipboardData)) {
          event.preventDefault();
        }
      }
    },
    [editor],
  );

  React.useEffect(() => {
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener(
      "copy",
      async (event) => await copySelectedBlocks(editor, event),
    );
    document.addEventListener(
      "cut",
      async (event) => await copySelectedBlocks(editor, event, true),
    );
    document.addEventListener("paste", onPaste);

    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener(
        "copy",
        async (event) => await copySelectedBlocks(editor, event),
      );
      document.removeEventListener(
        "cut",
        async (event) => await copySelectedBlocks(editor, event, true),
      );
      document.removeEventListener("paste", onPaste);
    };
  }, [editor, onMouseDown, onMouseMove, onMouseUp, onPaste]);

  const onKey = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        hasSelection()
      ) {
        event.preventDefault();
        deleteSelectedBlocks(editor);

        return true;
      }

      if (event.key === "a" && (event.ctrlKey || event.metaKey)) {
        const { selection } = editor;
        if (!selection) {
          event.preventDefault();
          selectAll(editor);
          return true;
        }
      }

      if (
        ["Meta", "Control", "Shift"].includes(event.key) ||
        ((event.key === "c" || event.key === "x" || event.key === "v") &&
          (event.metaKey || event.ctrlKey))
      ) {
        // don't deselect when copying or cutting or pasting
        return true;
      }

      if (hasSelection()) {
        deselectAll(editor);
      }

      if (event.key === "Escape") {
        event.preventDefault();
        if (editor.selection) {
          Transforms.deselect(editor);
        }
      }
      return false;
    },
    [hasSelection, editor],
  );

  React.useImperativeHandle(ref, () => ({
    onKey,
    hasSelection,
    selectByMouseCoordinate,
  }));

  return (
    <div
      className="pointer-events-none absolute z-50 h-full w-full rounded-sm bg-blue-500/20"
      style={{
        display: rect ? "block" : "none",
        top: rect?.y,
        left: rect?.x,
        width: rect?.width,
        height: rect?.height,
      }}
    />
  );
});
DragSelect.displayName = "DragSelect";
