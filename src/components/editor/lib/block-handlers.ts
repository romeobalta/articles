import { Editor, Element, Node, Path, Range, Transforms } from "slate";
import { HistoryEditor, MERGING } from "slate-history";

import { BLOCKS, PARAGRAPH } from "..";

import {
  canParentContainChild,
  getChildTypeFromParent,
  getCurrentBlockElement,
  getInsertDetailsByContainerType,
  getParentContainer,
  isContainerElement,
  isSelectableElement,
} from "./block-helpers";
import {
  deserialize as deserializeText,
  serialize as serializeText,
} from "./text-serializer";

export const cleanNodes = (editor: Editor) => {
  return editor.children.map((node) => {
    if (Element.isElement(node) && editor.isBlock(node)) {
      return {
        type: node.type,
        children: node.children.map((child) => {
          if (Element.isElement(child)) {
            return {
              type: child.type,
              children: child.children,
            };
          }

          return child;
        }),

        ...(node.type === "code" ? { language: node.language } : {}),
        ...(node.type === "heading" ? { level: node.level } : {}),
      };
    }
    return {};
  });
};

export const insertContainerBlock = (
  editor: Editor,
  type: string,
  at?: Path,
) => {
  const { child, parent } = getInsertDetailsByContainerType(type);
  if (!child || !parent) {
    return;
  }
  Transforms.insertNodes(editor, child as Element, {
    select: true,
    at,
  });

  Transforms.wrapNodes(editor, parent as Element, {
    match: (node) =>
      !Editor.isEditor(node) &&
      Element.isElement(node) &&
      node.type === child.type,
  });
};

export const insertBlock = (
  editor: Editor,
  block: (typeof BLOCKS)[0],
  at?: Path,
) => {
  if (isContainerElement(block.type)) {
    insertContainerBlock(editor, block.type, at);
    return;
  }

  const node = {
    ...block,
    children: [{ text: "" }],
  } as Element;
  Transforms.insertNodes(editor, node, { select: true, at });
};

export const changeBlockType = (editor: Editor, block: (typeof BLOCKS)[0]) => {
  if (isContainerElement(block.type)) {
    const { child, parent } = getInsertDetailsByContainerType(block.type);
    if (!child || !parent) {
      return;
    }

    Transforms.unsetNodes(editor, "selected");
    Transforms.setNodes(editor, child);
    Transforms.wrapNodes(editor, parent as Element, {
      match: (node) =>
        !Editor.isEditor(node) &&
        Element.isElement(node) &&
        node.type === child.type,
    });

    return;
  }

  const node = {
    ...block,
  } as Partial<Element>;
  Transforms.setNodes(editor, node);
};

export const changeOrInsertBlock = (
  editor: Editor,
  block: (typeof BLOCKS)[0],
) => {
  const { parent, parentPath } = getParentContainer(editor);
  if (parent) {
    if (!canParentContainChild(parent.type, block.type)) {
      insertBlock(editor, block, Path.next(parentPath));
      return;
    }
  }

  const [emptyBlockEntry] = editor.nodes({
    match: (node) =>
      Element.isElement(node) && editor.isBlock(node) && editor.isEmpty(node),
  });
  if (emptyBlockEntry) {
    const [, path] = emptyBlockEntry;

    if (path) {
      changeBlockType(editor, block);
      return;
    }
  }

  insertBlock(editor, block);
};

export const selectByPath = (editor: Editor, path: Path) => {
  HistoryEditor.withoutSaving(editor, () => {
    Transforms.setNodes(
      editor,
      { selected: true },
      {
        at: path,
        match: (n) =>
          Element.isElement(n) && editor.isBlock(n) && isSelectableElement(n),
      },
    );
  });
};

export const deselectByPath = (editor: Editor, path: Path) => {
  HistoryEditor.withoutSaving(editor, () => {
    Transforms.setNodes(
      editor,
      { selected: false },
      {
        at: path,
        match: (n) =>
          Element.isElement(n) && editor.isBlock(n) && isSelectableElement(n),
      },
    );
  });
};

export const selectAll = (editor: Editor) => {
  HistoryEditor.withoutSaving(editor, () => {
    Transforms.setNodes(
      editor,
      { selected: true },
      {
        at: [],
        match: (n) => Element.isElement(n) && isSelectableElement(n),
      },
    );
  });
};

export const deselectAll = (editor: Editor) => {
  HistoryEditor.withoutSaving(editor, () => {
    Transforms.setNodes(
      editor,
      { selected: false },
      {
        at: [],
        match: (n) =>
          Element.isElement(n) &&
          editor.isBlock(n) &&
          isSelectableElement(n) &&
          n.selected === true,
      },
    );
  });
};

export const deleteSelectedBlocks = (editor: Editor): Path | undefined => {
  let firstPath: Path | undefined;

  editor.writeHistory("undos", {
    operations: [],
    selectionBefore: editor.selection,
  });
  MERGING.set(editor, true);

  Transforms.removeNodes(editor, {
    at: [],
    match: (n, path) => {
      const isSelected =
        Element.isElement(n) &&
        editor.isBlock(n) &&
        isSelectableElement(n) &&
        n.selected === true;
      if (isSelected && !firstPath) {
        firstPath = path;
      }
      return isSelected;
    },
  });

  return firstPath;
};

export const copySelectedBlocks = async (
  editor: Editor,
  event: ClipboardEvent,
  withCut = false,
) => {
  const selectedBlocks = Array.from(
    editor.nodes({
      at: [],
      match: (n) =>
        Element.isElement(n) &&
        editor.isBlock(n) &&
        isSelectableElement(n) &&
        !!n.selected,
    }),
  );

  if (selectedBlocks.length) {
    const nodes = selectedBlocks.map(([node]) => node);

    const serialized = serializeText(nodes);

    event.preventDefault();
    try {
      // TODO: clean selection on serialize
      event.clipboardData?.setData(
        "text/@articles-blocks",
        JSON.stringify(nodes),
      );
      event.clipboardData?.setData("text/plain", serialized);
      event.clipboardData?.setData("text/html", "</>");

      if (withCut) {
        deleteSelectedBlocks(editor);
      }
    } catch (err) {
      console.error(err);
    }
  }
};

// TODO: wrap list items after this
export const pasteBlocks = (editor: Editor, data: DataTransfer) => {
  let nodes: Node[] | null = null;

  const plain = data.getData("text/plain");

  // const html = data.getData("text/html")
  // if (html) {
  // const parsed = new DOMParser().parseFromString(html, "text/html")
  // const nodes = parsed.body.childNodes
  // Transforms.insertNodes(editor, nodes, { select: true })
  // return
  // }

  const jsonBlocks = data.getData("text/@articles-blocks");
  if (jsonBlocks) {
    nodes = JSON.parse(jsonBlocks);
  }

  // If we have plain but nothing else, we'll just paste it as text
  if (plain && !jsonBlocks) {
    return false;
  }

  if (nodes && nodes.length) {
    // remove any nodes that are selected
    let pasteAt = deleteSelectedBlocks(editor);

    const { selection } = editor;

    // if we are inside a block (cursor)
    if (selection) {
      if (Range.isCollapsed(selection)) {
        const { parent, parentPath } = getParentContainer(editor);
        // if we are in a container
        if (parent) {
          for (const node of nodes) {
            // if its plain text, paste it and convert to child type
            if (plain && !jsonBlocks) {
              const childType = getChildTypeFromParent(parent.type);
              if (!childType) {
                continue;
              }
              Transforms.insertNodes(editor, node);

              const lastChildPath = parentPath.concat([0]);
              Transforms.setNodes(
                editor,
                { type: childType },
                { at: lastChildPath },
              );
              continue;
            }

            // if we can paste inside container do it
            if (
              Element.isElement(node) &&
              canParentContainChild(parent.type, node.type)
            ) {
              Transforms.insertNodes(editor, node);
              continue;
            }

            // if we can't paste inside container, paste after it
            Transforms.insertNodes(editor, node, {
              at: Path.next(parentPath),
            });
          }
          return true;
        }

        const { block, blockPath } = getCurrentBlockElement(editor);

        // if we are in a block
        if (block) {
          // paster after it
          pasteAt = Path.next(blockPath);

          // if it's empty, replace it
          if (editor.isEmpty(block)) {
            Transforms.removeNodes(editor, {
              at: blockPath,
            });
            pasteAt = blockPath;
          }
        }
      }
    }

    // if we need to paste at the end
    if (!pasteAt) {
      Transforms.select(editor, editor.end([]));
      const { parent, parentPath } = getParentContainer(editor);
      if (parent) {
        // if we are in a container, paste after it
        Transforms.insertNodes(editor, nodes, {
          at: Path.next(parentPath),
        });
        return true;
      }
    }

    // otherwise just paste at the position or after it
    Transforms.insertNodes(editor, nodes, {
      select: false,
      at: pasteAt ?? editor.end([]),
    });
    Transforms.deselect(editor);
    return true;
  }

  return false;
};

export const insertDefaultElement = (editor: Editor) => {
  const { selection } = editor;

  if (selection) {
    const { blockPath } = getCurrentBlockElement(editor);

    if (blockPath) {
      const parent = Node.parent(editor, blockPath);
      if (
        !parent ||
        Editor.isEditor(parent) ||
        (Element.isElement(parent) && !isContainerElement(parent.type))
      ) {
        Transforms.insertNodes(
          editor,
          {
            ...PARAGRAPH,
            children: [{ text: "" }],
          },
          { select: true },
        );
        return true;
      }
    }
  }

  return false;
};

export const resetCurrentElement = (editor: Editor) => {
  const { block, blockPath } = getCurrentBlockElement(editor);

  if (block) {
    const { parent } = getParentContainer(editor);
    if (parent) {
      if (!canParentContainChild(parent.type, PARAGRAPH.type)) {
        Transforms.liftNodes(editor, {
          at: blockPath,
        });
      }
    }

    // if the node is not the default block type, reset it
    if (block && Element.isElement(block) && block.type !== PARAGRAPH.type) {
      Transforms.setNodes(editor, PARAGRAPH, {
        match: (n) => Element.isElement(n) && editor.isBlock(n),
      });
      return true;
    }
  }
  return false;
};

// TODO: wrap list items after this
export const insertCustomData = (editor: Editor, data: DataTransfer) => {
  let nodes: Node[] | null = null;

  const jsonBlocks = data.getData("text/@articles-blocks");
  if (jsonBlocks) {
    nodes = JSON.parse(jsonBlocks);
  }

  // const html = data.getData("text/html")
  // if (html) {
  // const parsed = new DOMParser().parseFromString(html, "text/html")
  // const nodes = parsed.body.childNodes
  // Transforms.insertNodes(editor, nodes, { select: true })
  // return
  // }

  const plain = data.getData("text/plain");
  if (plain) {
    nodes = deserializeText(plain);
  }

  if (nodes && nodes.length) {
    // if there are blocks selected, we'll write over them
    const options = {
      select: false,
    };

    // TODO: do we want this or just break the block?
    // select end of current block
    const { selection } = editor;
    if (selection) {
      const path = editor.path(selection);
      const end = editor.end(path);
      Transforms.select(editor, end);

      Transforms.removeNodes(editor, {
        match: (n) =>
          Element.isElement(n) && editor.isBlock(n) && editor.isEmpty(n),
      });

      options.select = true;
    }

    Transforms.insertNodes(editor, nodes, options);
    return true;
  }

  return false;
};
