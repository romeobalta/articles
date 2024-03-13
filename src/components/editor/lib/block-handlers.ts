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

// Not sure about how this works with the setEditor method
// Maybe we should just accept an editor as a parameter for each method
// Similar to how slate does it
export class BlockHandlers {
  private editor: Editor;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  insertContainerBlock = (type: string, at?: Path) => {
    const { child, parent } = getInsertDetailsByContainerType(type);
    if (!child || !parent) {
      return;
    }
    Transforms.insertNodes(this.editor, child as Element, {
      select: true,
      at,
    });

    Transforms.wrapNodes(this.editor, parent as Element, {
      match: (node) =>
        !Editor.isEditor(node) &&
        Element.isElement(node) &&
        node.type === child.type,
    });
  };

  insertBlock = (block: (typeof BLOCKS)[0], at?: Path) => {
    if (isContainerElement(block.type)) {
      this.insertContainerBlock(block.type, at);
      return;
    }

    const node = {
      ...block,
      children: [{ text: "" }],
    } as Element;
    Transforms.insertNodes(this.editor, node, { select: true, at });
  };

  changeBlockType = (block: (typeof BLOCKS)[0]) => {
    if (isContainerElement(block.type)) {
      const { child, parent } = getInsertDetailsByContainerType(block.type);
      if (!child || !parent) {
        return;
      }

      Transforms.unsetNodes(this.editor, "selected");
      Transforms.setNodes(this.editor, child);
      Transforms.wrapNodes(this.editor, parent as Element, {
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
    Transforms.setNodes(this.editor, node);
  };

  changeOrInsertBlock = (block: (typeof BLOCKS)[0]) => {
    const { parent, parentPath } = getParentContainer(this.editor);
    if (parent) {
      if (!canParentContainChild(parent.type, block.type)) {
        this.insertBlock(block, Path.next(parentPath));
        return;
      }
    }

    const [emptyBlockEntry] = this.editor.nodes({
      match: (node) =>
        Element.isElement(node) &&
        this.editor.isBlock(node) &&
        this.editor.isEmpty(node),
    });
    if (emptyBlockEntry) {
      const [, path] = emptyBlockEntry;

      if (path) {
        this.changeBlockType(block);
        return;
      }
    }

    this.insertBlock(block);
  };

  selectByPath = (path: Path) => {
    HistoryEditor.withoutSaving(this.editor, () => {
      Transforms.setNodes(
        this.editor,
        { selected: true },
        {
          at: path,
          match: (n) =>
            Element.isElement(n) &&
            this.editor.isBlock(n) &&
            isSelectableElement(n),
        },
      );
    });
  };

  deselectByPath = (path: Path) => {
    HistoryEditor.withoutSaving(this.editor, () => {
      Transforms.setNodes(
        this.editor,
        { selected: false },
        {
          at: path,
          match: (n) =>
            Element.isElement(n) &&
            this.editor.isBlock(n) &&
            isSelectableElement(n),
        },
      );
    });
  };

  selectAll = () => {
    HistoryEditor.withoutSaving(this.editor, () => {
      Transforms.setNodes(
        this.editor,
        { selected: true },
        {
          at: [],
          match: (n) => Element.isElement(n) && isSelectableElement(n),
        },
      );
    });
  };

  deselectAll = () => {
    HistoryEditor.withoutSaving(this.editor, () => {
      Transforms.setNodes(
        this.editor,
        { selected: false },
        {
          at: [],
          match: (n) =>
            Element.isElement(n) &&
            this.editor.isBlock(n) &&
            isSelectableElement(n) &&
            n.selected === true,
        },
      );
    });
  };

  deleteSelectedBlocks = (): Path | undefined => {
    let firstPath: Path | undefined;

    this.editor.writeHistory("undos", {
      operations: [],
      selectionBefore: this.editor.selection,
    });
    MERGING.set(this.editor, true);

    Transforms.removeNodes(this.editor, {
      at: [],
      match: (n, path) => {
        const isSelected =
          Element.isElement(n) &&
          this.editor.isBlock(n) &&
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

  copySelectedBlocks = async (event: ClipboardEvent, withCut = false) => {
    const selectedBlocks = Array.from(
      this.editor.nodes({
        at: [],
        match: (n) =>
          Element.isElement(n) &&
          this.editor.isBlock(n) &&
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
          this.deleteSelectedBlocks();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // TODO: wrap list items after this
  pasteBlocks = (data: DataTransfer) => {
    let nodes: Node[] | null = null;

    const plain = data.getData("text/plain");

    // const html = data.getData("text/html")
    // if (html) {
    // const parsed = new DOMParser().parseFromString(html, "text/html")
    // const nodes = parsed.body.childNodes
    // Transforms.insertNodes(this.editor, nodes, { select: true })
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
      let pasteAt = this.deleteSelectedBlocks();

      const { selection } = this.editor;

      // if we are inside a block (cursor)
      if (selection) {
        if (Range.isCollapsed(selection)) {
          const { parent, parentPath } = getParentContainer(this.editor);
          // if we are in a container
          if (parent) {
            for (const node of nodes) {
              // if its plain text, paste it and convert to child type
              if (plain && !jsonBlocks) {
                const childType = getChildTypeFromParent(parent.type);
                if (!childType) {
                  continue;
                }
                Transforms.insertNodes(this.editor, node);

                const lastChildPath = parentPath.concat([0]);
                Transforms.setNodes(
                  this.editor,
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
                Transforms.insertNodes(this.editor, node);
                continue;
              }

              // if we can't paste inside container, paste after it
              Transforms.insertNodes(this.editor, node, {
                at: Path.next(parentPath),
              });
            }
            return true;
          }

          const { block, blockPath } = getCurrentBlockElement(this.editor);

          // if we are in a block
          if (block) {
            // paster after it
            pasteAt = Path.next(blockPath);

            // if it's empty, replace it
            if (this.editor.isEmpty(block)) {
              Transforms.removeNodes(this.editor, {
                at: blockPath,
              });
              pasteAt = blockPath;
            }
          }
        }
      }

      // if we need to paste at the end
      if (!pasteAt) {
        Transforms.select(this.editor, this.editor.end([]));
        const { parent, parentPath } = getParentContainer(this.editor);
        if (parent) {
          // if we are in a container, paste after it
          Transforms.insertNodes(this.editor, nodes, {
            at: Path.next(parentPath),
          });
          return true;
        }
      }

      // otherwise just paste at the position or after it
      Transforms.insertNodes(this.editor, nodes, {
        select: false,
        at: pasteAt ?? this.editor.end([]),
      });
      Transforms.deselect(this.editor);
      return true;
    }

    return false;
  };

  insertDefaultElement = () => {
    const { selection } = this.editor;

    if (selection) {
      const { blockPath } = getCurrentBlockElement(this.editor);

      if (blockPath) {
        const parent = Node.parent(this.editor, blockPath);
        if (
          !parent ||
          Editor.isEditor(parent) ||
          (Element.isElement(parent) && !isContainerElement(parent.type))
        ) {
          Transforms.insertNodes(
            this.editor,
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

  resetCurrentElement = () => {
    const { block, blockPath } = getCurrentBlockElement(this.editor);

    if (block) {
      const { parent } = getParentContainer(this.editor);
      if (parent) {
        if (!canParentContainChild(parent.type, PARAGRAPH.type)) {
          Transforms.liftNodes(this.editor, {
            at: blockPath,
          });
        }
      }

      // if the node is not the default block type, reset it
      if (block && Element.isElement(block) && block.type !== PARAGRAPH.type) {
        Transforms.setNodes(this.editor, PARAGRAPH, {
          match: (n) => Element.isElement(n) && this.editor.isBlock(n),
        });
        return true;
      }
    }
    return false;
  };

  // TODO: wrap list items after this
  insertCustomData = (data: DataTransfer) => {
    let nodes: Node[] | null = null;

    const jsonBlocks = data.getData("text/@articles-blocks");
    if (jsonBlocks) {
      nodes = JSON.parse(jsonBlocks);
    }

    // const html = data.getData("text/html")
    // if (html) {
    // const parsed = new DOMParser().parseFromString(html, "text/html")
    // const nodes = parsed.body.childNodes
    // Transforms.insertNodes(this.editor, nodes, { select: true })
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
      const { selection } = this.editor;
      if (selection) {
        const path = this.editor.path(selection);
        const end = this.editor.end(path);
        Transforms.select(this.editor, end);

        Transforms.removeNodes(this.editor, {
          match: (n) =>
            Element.isElement(n) &&
            this.editor.isBlock(n) &&
            this.editor.isEmpty(n),
        });

        options.select = true;
      }

      Transforms.insertNodes(this.editor, nodes, options);
      return true;
    }

    return false;
  };
}
