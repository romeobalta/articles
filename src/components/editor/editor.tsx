import React from "react";

import { BaseRange, createEditor, Descendant, Element, NodeEntry } from "slate";
import { withHistory } from "slate-history";
import { Editable, ReactEditor, Slate, useSlate, withReact } from "slate-react";

import { cn } from "@/lib/utils";
import {
  getDecorationsForCodeblockTokens,
  mergeMaps,
  useDecorate,
  withCustomEditor,
  withMarkdownShortcuts,
} from "./lib";

import { Block } from "./block";
import { CODE, PARAGRAPH } from "./blocks";
import { DragSelect, DragSelectRef } from "./drag-select";
import { CodeElement } from "./editor-types";
import { GeneralPicker, GeneralPickerRef } from "./general-picker";
import { HoveringToolbar, HoveringToolbarRef } from "./hovering-toolbar";
import { Leaf } from "./leaf";

const initialValue: Descendant[] = [PARAGRAPH];

// type EditorProps = {
//   title: string;
//   setTitle: (title: string) => void;
// };

const Editor = () => {
  const [title, setTitle] = React.useState("Untitled");
  const editorRef = React.useRef<HTMLDivElement>(null);

  const [editor] = React.useState(() =>
    withMarkdownShortcuts(
      withReact(withCustomEditor(withHistory(createEditor()))),
    ),
  );

  const generalPickerRef = React.useRef<GeneralPickerRef>(null);
  const dragSelectRef = React.useRef<DragSelectRef>(null);
  const hoveringToolbarRef = React.useRef<HoveringToolbarRef>(null);

  const focustIfClickOutside = React.useCallback(
    (event: MouseEvent) => {
      if (event.target instanceof HTMLElement) {
        const { selection } = editor;
        if (
          !editorRef.current?.contains(event.target) &&
          event.target.tagName !== "INPUT" &&
          !dragSelectRef.current?.hasSelection() &&
          !selection
        ) {
          ReactEditor.focus(editor);
          dragSelectRef.current?.selectByMouseCoordinate(
            event.pageX,
            event.pageY,
          );
        }
      }
    },
    [editor],
  );

  React.useEffect(() => {
    document
      .getElementById("document-root")
      ?.addEventListener("click", focustIfClickOutside);

    return () => {
      document
        .getElementById("document-root")
        ?.removeEventListener("click", focustIfClickOutside);
    };
  }, [focustIfClickOutside]);

  const [fakeSelection, setFakeSelection] = React.useState<BaseRange | null>(
    null,
  );

  const decorate = useDecorate(editor, fakeSelection);

  return (
    <div
      id="document-root"
      className={cn(
        "flex w-full flex-1 cursor-text justify-center antialiased",
      )}
    >
      <div className="w-full max-w-screen-md px-10 py-10 bg-white">
        <div className="w-full">
          <input
            type="text"
            className="w-full break-words bg-transparent p-0 pl-0.5 text-3xl font-semibold text-skin-primary placeholder-slate-400 outline-none"
            placeholder="Untitled"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="mt-3 w-full" ref={editorRef}>
          <Slate editor={editor} initialValue={initialValue}>
            <SetDecorationsForCode />
            <GeneralPicker ref={generalPickerRef} />
            <DragSelect ref={dragSelectRef} />

            <HoveringToolbar
              ref={hoveringToolbarRef}
              fakeSelection={fakeSelection}
              setFakeSelection={setFakeSelection}
            />

            <Editable
              className="text-skin-secondary focus-visible:outline-none"
              decorate={decorate}
              // onDOMBeforeInput={checkForMarkdownShortcutOnInput}
              onKeyDown={(event) => {
                if (
                  generalPickerRef.current?.onKey(event) ||
                  dragSelectRef.current?.onKey(event) ||
                  hoveringToolbarRef.current?.onKey(event)
                ) {
                  return;
                }

                if (event.key === "Tab") {
                  event.preventDefault();
                  editor.insertText("  ");
                }
              }}
              renderElement={(props) => <Block {...props} />}
              renderLeaf={(props) => <Leaf {...props} />}
            />
          </Slate>
        </div>
      </div>
    </div>
  );
};

const SetDecorationsForCode = () => {
  const editor = useSlate();

  const blockEntries = Array.from(
    editor.nodes({
      at: [],
      mode: "highest",
      match: (n) => Element.isElement(n) && n.type === CODE.type,
    }),
  ) as NodeEntry<CodeElement>[];

  const nodeToDecorations = mergeMaps(
    ...blockEntries.map(getDecorationsForCodeblockTokens),
  );

  editor.codeblocksDecorations = nodeToDecorations;

  return null;
};

export { Editor };
