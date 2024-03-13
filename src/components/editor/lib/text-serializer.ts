import mdast from "mdast";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import { Element, Node } from "slate";
import { unified } from "unified";

import { BLOCKQUOTE, HEADINGS, PARAGRAPH } from "..";
import {
  BlockquoteElement,
  CustomElement,
  CustomText,
  HeadingElement,
  ParagraphElement,
} from "../editor-types";

const serializeText = (node: Node) => {
  return Node.string(node);
};

const serializeHeading = (node: HeadingElement) => {
  return "#".repeat(node.level) + " " + Node.string(node);
};

const serializeBlockquote = (node: BlockquoteElement) => {
  return "> " + Node.string(node).replace(/\n/g, "\n> ");
};

export const serialize = (nodes: Node[]) => {
  return nodes
    .map((n) => {
      if (Element.isElement(n)) {
        switch (n.type) {
          case "heading":
            return serializeHeading(n);

          case "blockquote":
            return serializeBlockquote(n);

          case "paragraph":
          default:
            return serializeText(n);
        }
      }
      return serializeText(n);
    })
    .join("\n");
};

const deserializeHeading = (node: mdast.Heading): HeadingElement => {
  const level = node.depth;
  const defaultHeadingProps = HEADINGS.find(
    (b) => b.level === level,
  ) as (typeof HEADINGS)[0];
  return {
    ...defaultHeadingProps,
    children: [...deserializeLeaves(node.children)],
  };
};

const deserializePragraphChildren = (node: mdast.Paragraph) => {
  const leaves = deserializeLeaves(node.children).flat();
  return leaves;
};

const deserializeParagraph = (node: mdast.Paragraph): ParagraphElement => {
  return {
    ...PARAGRAPH,
    children: [...deserializePragraphChildren(node)],
  };
};

const deserializeBlockquote = (node: mdast.Blockquote): BlockquoteElement => {
  return {
    ...BLOCKQUOTE,
    children: [
      ...node.children
        .filter((n): n is mdast.Paragraph => n.type === "paragraph")
        .map((n) => deserializePragraphChildren(n))
        .flat(),
    ],
  };
};

export const deserializeLeaves = (nodes: mdast.RootContent[]): CustomText[] => {
  return nodes.length
    ? nodes.map((n) => deserializeLeaf(n)).flat()
    : [deserializeLeaf()];
};

export const deserializeLeaf = (node?: mdast.RootContent): CustomText => {
  if (node?.type === "text") {
    return { text: node.value };
  }

  return { text: "" };
};

export const deserialize = (text: string): CustomElement[] => {
  const rawNodes = unified()
    .use(remarkParse)
    .use(remarkBreaks)
    .use(remarkGfm)
    .parse(text);

  const isCustomElement = (
    element: ParagraphElement | HeadingElement | BlockquoteElement | null,
  ): element is ParagraphElement | HeadingElement | BlockquoteElement => {
    return element !== null;
  };

  return rawNodes.children
    .map((node) => {
      if (node.type === "heading") {
        return deserializeHeading(node);
      }
      if (node.type === "paragraph") {
        return deserializeParagraph(node);
      }
      if (node.type === "blockquote") {
        return deserializeBlockquote(node);
      }
      return null;
    })
    .filter(isCustomElement) as CustomElement[];
};
