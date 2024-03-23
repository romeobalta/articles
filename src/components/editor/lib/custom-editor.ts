import {
  Editor,
  Element,
  Node,
  Path,
  Range,
  TextUnit,
  Transforms,
} from "slate";

import { PARAGRAPH } from "../";

import {
  canParentContainChild,
  getCurrentBlockElement,
  getInsertDetailsByContainerType,
  getParentContainer,
  isContainerElement,
  shouldMergeAdjacentContainers,
  shouldResetOnDeleteEmpty,
} from "./block-helpers";
import {
  insertCustomData,
  insertDefaultElement,
  resetCurrentElement,
} from "./block-handlers";

export const withCustomEditor = (editor: Editor) => {
  const {
    deleteBackward,
    // deleteFragment,
    insertBreak,
    insertData,
    insertFragment,
    // insertNode,
    normalizeNode,
  } = editor;

  editor.isInline = (element) => {
    return element.type === "link";
  };

  editor.insertBreak = () => {
    if (insertDefaultElement(editor)) {
      return;
    }

    insertBreak();
  };

  editor.insertSoftBreak = () => {
    const { parent } = getParentContainer(editor);
    if (parent && isContainerElement(parent.type)) {
      insertBreak();
      resetCurrentElement(editor);
      return;
    }

    editor.insertText("\n");
  };

  editor.insertData = (data: DataTransfer) => {
    if (insertCustomData(editor, data)) {
      return;
    }

    insertData(data);
  };

  editor.insertFragment = (fragment: Node[]) => {
    const { parent, parentPath } = getParentContainer(editor);
    if (parent && isContainerElement(parent.type)) {
      for (const child of fragment) {
        if (Element.isElement(child)) {
          if (parent.type === child.type) {
            Transforms.insertNodes(editor, child.children);
            continue;
          }
          if (!canParentContainChild(parent.type, child.type)) {
            const newPath = Path.next(parentPath);
            Transforms.insertNodes(editor, child, {
              at: newPath,
            });
            continue;
          }

          insertFragment([child]);
        }
      }
      return;
    }

    insertFragment(fragment);
  };

  // editor.deleteFragment = () => {
  // TODO: need to fix this for containers :(
  // const { selection } = editor
  // if (selection && Range.isExpanded(selection)) {
  //   const nodes = editor.nodes({
  //     at: selection,
  //   })
  //
  //   const ranges: Range[] = []
  //
  //   for (const [node, nodePath] of nodes) {
  //     debugger
  //     if (Element.isElement(node)) {
  //       if (isContainerElement(node.type)) {
  //         continue
  //       }
  //
  //       const rangeInNode = Range.intersection(selection, {
  //         anchor: { path: nodePath, offset: 0 },
  //         focus: { path: nodePath, offset: node.children.length },
  //       })
  //       if (rangeInNode) {
  //         if (ranges.length > 0) {
  //           const lastRange = ranges[ranges.length - 1]
  //           if (
  //             Path.isSibling(lastRange.anchor.path, rangeInNode.anchor.path)
  //           ) {
  //             lastRange.focus.path = rangeInNode.focus.path
  //             lastRange.focus.offset = rangeInNode.focus.offset
  //             continue
  //           }
  //         }
  //         ranges.push(rangeInNode)
  //       }
  //     }
  //   }
  //
  //   editor.withoutNormalizing(() => {
  //     debugger
  //     for (const range of ranges) {
  //       Transforms.delete(editor, {
  //         at: range,
  //       })
  //     }
  //   })
  //   editor.normalize()
  //
  //   return
  // }
  //
  //   deleteFragment()
  // }

  editor.deleteBackward = (unit: TextUnit) => {
    const { block, blockPath } = getCurrentBlockElement(editor, true);

    if (block) {
      if (Element.isElement(block) && shouldResetOnDeleteEmpty(block.type)) {
        if (resetCurrentElement(editor)) {
          return;
        }
      }

      const { selection } = editor;

      if (selection && Range.isCollapsed(selection)) {
        // if the node is not resetable type remove it
        Transforms.removeNodes(editor, {
          at: blockPath,
        });
        return;
      }
    }

    deleteBackward(unit);
  };

  editor.normalizeNode = (entry) => {
    const [node, path] = entry;

    if (Editor.isEditor(node)) {
      if (!node.children.length) {
        Transforms.insertNodes(editor, PARAGRAPH);
        return;
      }

      // TODO: this might need done for any other nesteble block
      // Merge adjacent containers
      const children = Node.elements(node);
      for (const [child, childPath] of children) {
        if (
          isContainerElement(child.type) &&
          shouldMergeAdjacentContainers(child.type)
        ) {
          const previousEntry = Editor.previous(editor, { at: childPath });

          if (previousEntry) {
            const [previousNode] = previousEntry;

            if (
              Element.isElement(previousNode) &&
              previousNode.type === child.type
            ) {
              Transforms.mergeNodes(editor, { at: childPath });
              return;
            }
          }
        }
      }
    }

    // Remove all empty containers
    if (Element.isElement(node) && isContainerElement(node.type)) {
      if (node.children.length === 0) {
        Transforms.removeNodes(editor, { at: path });
        return;
      }

      for (const [child, childPath] of Node.children(editor, path)) {
        if (Element.isElement(child)) {
          if (!canParentContainChild(node.type, child.type)) {
            if (isContainerElement(child.type)) {
              Transforms.liftNodes(editor, { at: childPath });
              return;
            }

            const { child: childTemplate } = getInsertDetailsByContainerType(
              node.type,
            );

            if (childTemplate) {
              if (!("selected" in childTemplate)) {
                Transforms.unsetNodes(editor, "selected", { at: path });
              }

              Transforms.setNodes(editor, {
                // @ts-ignore
                type: childTemplate.type,
                at: path,
              });
              return;
            }
          }
        }
      }
    }

    if (Element.isElement(node) && node.type === "link") {
      if (node.children.length === 0 || node.children[0].text === "") {
        Transforms.removeNodes(editor, { at: path });
        return;
      }
    }

    normalizeNode(entry);
  };

  editor.codeblocksDecorations = new Map();

  return editor;
};
