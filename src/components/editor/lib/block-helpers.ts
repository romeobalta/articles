import React from "react";

import {
  BaseRange,
  Editor,
  Element,
  Node,
  NodeEntry,
  Range,
  Text,
} from "slate";

import { BULLETLIST } from "../blocks/bullet-list";
import { CODE } from "../blocks/code";
import { CODELINE } from "../blocks/code-line";
import { LISTITEM } from "../blocks/list-item";
import { NUMBERLIST } from "../blocks/number-list";
import {
  CodeElement,
  CodeLineElement,
  ContainerElement,
  CustomEditor,
  CustomElement,
  InlineElement,
  ListElement,
  SelectableElement,
} from "../editor-types";

import { normalizeTokens, Prism } from "./prism-helpers";

const CONTAINER_TO_CHILDREN_MAP = {
  "bullet-list": ["list-item"],
  "number-list": ["list-item"],
  code: ["code-line"],
};

const CONTAINER_TO_INSERT_MAP = {
  "bullet-list": {
    child: {
      ...LISTITEM,
    },
    parent: {
      type: BULLETLIST.type,
      children: [],
    },
  },
  "number-list": {
    child: {
      ...LISTITEM,
    },
    parent: {
      type: NUMBERLIST.type,
      children: [],
    },
  },
  code: {
    child: {
      ...CODELINE,
    },
    parent: {
      type: CODE.type,
      language: CODE.language,
      children: [],
      selected: false,
    },
  },
};

export function isSelectableElement(
  element: CustomElement,
): element is SelectableElement {
  return "selected" in element;
}

export function isListElement(type: string): type is ListElement["type"] {
  return ["bullet-list", "number-list"].includes(type);
}

export function isCodeElement(type: string): type is CodeElement["type"] {
  return type === "code";
}

export function isContainerElement(
  type: string,
): type is ContainerElement["type"] {
  return isListElement(type) || isCodeElement(type);
}

export function isInlineElement(type: string): type is InlineElement["type"] {
  return type === "link";
}

export function canParentContainChild(
  parentType: string,
  childType: string,
): boolean {
  if (isContainerElement(parentType)) {
    return CONTAINER_TO_CHILDREN_MAP[parentType].includes(childType);
  }

  return false;
}

export function getChildTypeFromParent(
  parentType: string,
): CustomElement["type"] | undefined {
  if (isContainerElement(parentType)) {
    return CONTAINER_TO_CHILDREN_MAP[parentType][0];
  }
}

export function getInsertDetailsByContainerType(containerType: string): {
  child?: Partial<CustomElement>;
  parent?: Partial<CustomElement>;
} {
  if (isContainerElement(containerType)) {
    return CONTAINER_TO_INSERT_MAP[containerType];
  }
  return {};
}

export function shouldResetOnDeleteEmpty(type: string) {
  return !["code-line"].includes(type);
}

export function shouldMergeAdjacentContainers(type: string) {
  return isListElement(type);
}

export function getParentContainer(editor: Editor) {
  const { selection } = editor;
  if (selection) {
    const [match] = Editor.nodes(editor, {
      match: (node) =>
        !Editor.isEditor(node) &&
        Element.isElement(node) &&
        isContainerElement(node.type),
    });

    if (match) {
      return {
        parent: match[0] as ContainerElement,
        parentPath: match[1],
      };
    }
  }
  return {};
}

export function getCurrentBlockElement(editor: Editor, onlyEmpty?: boolean) {
  const block = Editor.above(editor, {
    match: (node) =>
      Element.isElement(node) &&
      Editor.isBlock(editor, node) &&
      (onlyEmpty ? editor.isEmpty(node) : true),
  });

  if (block) {
    return {
      block: block[0] as CustomElement,
      blockPath: block[1],
    };
  }

  return {};
}

export function getDecorationsForCodeblockTokens([
  codeblock,
  codeblockPath,
]: NodeEntry<CodeElement>) {
  const nodeToDecorations = new Map<CodeLineElement, BaseRange[]>();

  const text = codeblock.children
    .map((line) => (Element.isElement(line) ? Node.string(line) : ""))
    .join("\n");
  const language = codeblock.language;
  const tokens = Prism.tokenize(text, Prism.languages[language]);
  const normalizedTokens = normalizeTokens(tokens);
  const blockChildren = codeblock.children as CodeLineElement[];

  for (let index = 0; index < normalizedTokens.length; index++) {
    const tokens = normalizedTokens[index];
    const element = blockChildren[index];

    if (!nodeToDecorations.has(element)) {
      nodeToDecorations.set(element, []);
    }

    let start = 0;
    for (const token of tokens) {
      const length = token.content.length;
      if (!length) {
        continue;
      }

      const end = start + length;

      const path = [...codeblockPath, index, 0];
      const range = {
        anchor: { path, offset: start },
        focus: { path, offset: end },
        token: true,
        ...Object.fromEntries(token.types.map((type) => [type, true])),
      };

      nodeToDecorations.get(element)!.push(range);

      start = end;
    }
  }

  return nodeToDecorations;
}

export function useDecorate(
  editor: CustomEditor,
  fakeSelection: BaseRange | null,
) {
  return React.useCallback(
    ([node, position]: NodeEntry<Node>) => {
      if (Element.isElement(node) && node.type === "code-line") {
        return editor.codeblocksDecorations.get(node) ?? [];
      }

      if (
        fakeSelection &&
        Range.includes(fakeSelection, position) &&
        Text.isText(node)
      ) {
        return [
          {
            ...fakeSelection,
            fakeSelection: true,
          },
        ];
      }

      return [];
    },
    [editor.codeblocksDecorations, fakeSelection],
  );
}
