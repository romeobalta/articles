import { Editor, Element, Range, Transforms } from "slate";

import { BLOCKQUOTE, HEADING } from "../blocks";
import { getCurrentBlockElement } from "./block-helpers";

export const MARKDOWN_SHORTCUTS = {
  ">": {
    ...BLOCKQUOTE,
  },
  "#": {
    ...HEADING(1),
  },
  "##": {
    ...HEADING(2),
  },
  "###": {
    ...HEADING(3),
  },
  "####": {
    ...HEADING(4),
  },
  "#####": {
    ...HEADING(5),
  },
  "######": {
    ...HEADING(6),
  },
  // "```": "code-block",
  // "1.": "numbered-list",
  // "[]": "todo-list",
  // "*": "list-item",
  // "-": "list-item",
  // "+": "list-item",
};

const isMarkdownShortcut = (
  text: string,
): text is keyof typeof MARKDOWN_SHORTCUTS => {
  return Object.keys(MARKDOWN_SHORTCUTS).includes(text);
};

export const withMarkdownShortcuts = (editor: Editor) => {
  const { insertText } = editor;

  editor.insertText = (text: string) => {
    const { selection } = editor;

    if (text.endsWith(" ") && selection && Range.isCollapsed(selection)) {
      const { anchor } = selection;
      // Get current block (FFS)
      const { blockPath } = getCurrentBlockElement(editor);
      if (blockPath) {
        const start = Editor.start(editor, blockPath);
        const range = { anchor, focus: start };
        const beforeText = Editor.string(editor, range) + text.slice(0, -1);
        if (isMarkdownShortcut(beforeText)) {
          const type = MARKDOWN_SHORTCUTS[beforeText];

          if (type) {
            Transforms.select(editor, range);

            if (!Range.isCollapsed(range)) {
              Transforms.delete(editor);
            }

            const newProperties = {
              ...type,
            } as Partial<Node>;

            Transforms.setNodes(editor, newProperties, {
              match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
            });

            return;
          }
        }
      }
    }

    insertText(text);
  };
  return editor;
};

// Think this is needed for Android
export const checkForMarkdownShortcutOnInput = (
  _editor: Editor,
  _event: InputEvent,
) => {
  queueMicrotask(() => {
    // const pendingDiffs = ReactEditor.androidPendingDiffs(editor);
    //
    // const scheduleFlush = pendingDiffs?.some(({ diff, path }) => {
    //   if (!diff.text.endsWith(" ")) {
    //     return false
    //   }
    //
    //   const { text } = Node.leaf(editor, path)
    //   const beforeText = text.slice(0, diff.start) + diff.text.slice(0, -1)
    //   if (!(beforeText in MARKDOWN_SHORTCUTS)) {
    //     return false
    //   }
    //
    //   const blockEntry = Editor.above(editor, {
    //     at: path,
    //     match: (n) => Element.isElement(n) && Editor.isBlock(editor, n),
    //   })
    //   if (!blockEntry) {
    //     return false
    //   }
    //
    //   const [, blockPath] = blockEntry
    //   return Editor.isStart(editor, Editor.start(editor, path), blockPath)
    // })
    //
    // if (scheduleFlush) {
    //   ReactEditor.androidScheduleFlush(editor)
    // }
  });
};
