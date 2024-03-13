import clsx from "clsx";
import { RenderElementProps } from "slate-react";

import { isContainerElement } from "./lib";

import {
  Blockquote,
  BLOCKQUOTE,
  BulletList,
  BULLETLIST,
  Code,
  CODE,
  Heading,
  HEADINGS,
  ListItem,
  NumberList,
  NUMBERLIST,
  Paragraph,
} from "./blocks";
import { CodeLine } from "./blocks/code-line";
import { CustomElement } from "./editor-types";

export const BLOCKS = [...HEADINGS, BLOCKQUOTE, BULLETLIST, NUMBERLIST, CODE];

interface BlockProps extends RenderElementProps {
  element: CustomElement;
}

export const Block = ({ attributes, children, element }: BlockProps) => {
  const isSelected = (element: CustomElement) =>
    "selected" in element && element.selected;

  let Tag = Paragraph as React.ElementType;

  if (element.type === "heading") {
    Tag = Heading;
  }

  if (element.type === "blockquote") {
    Tag = Blockquote;
  }

  if (element.type === "bullet-list") {
    Tag = BulletList;
  }

  if (element.type === "number-list") {
    Tag = NumberList;
  }

  if (element.type === "list-item") {
    Tag = ListItem;
  }

  if (element.type === "code") {
    Tag = Code;
  }

  if (element.type === "code-line") {
    Tag = CodeLine;
  }

  // TODO: if cursor at the end of the link, move it outside
  if (element.type === "link") {
    return (
      <a
        {...attributes}
        href={element.url}
        className={clsx(
          "text-sky-500 underline",
          isSelected(element) && "bg-sky-500 text-white",
        )}
        target="_blank"
      >
        <InlineChromiumBugfix />
        {children}
        <InlineChromiumBugfix />
      </a>
    );
  }

  return (
    <Tag
      attributes={attributes}
      element={element}
      className={clsx(
        "my-0.5 rounded-sm",
        isSelected(element) && "!bg-blue-500/20",
        !isContainerElement(element.type) && "px-0.5",
      )}
    >
      {children}
    </Tag>
  );
};

const InlineChromiumBugfix = () => (
  <span contentEditable={false} style={{ fontSize: 0, userSelect: "none" }}>
    {String.fromCodePoint(160) /* Non-breaking space */}
  </span>
);
