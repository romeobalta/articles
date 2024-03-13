import { RenderLeafProps } from "slate-react";

import { cn } from "@/lib/utils";

import { CustomLeaf } from "./editor-types";

interface LeafProps extends RenderLeafProps {
  leaf: CustomLeaf;
}

export const Leaf = ({ attributes, children, leaf }: LeafProps) => {
  const { text: _text, ...rest } = leaf;

  if ("bold" in leaf && leaf.bold) {
    children = <strong>{children}</strong>;
  }

  if ("code" in leaf && leaf.code) {
    children = <code>{children}</code>;
  }

  if ("italic" in leaf && leaf.italic) {
    children = <em>{children}</em>;
  }

  if ("underline" in leaf && leaf.underline) {
    children = <u>{children}</u>;
  }

  if ("strikethrough" in leaf && leaf.strikethrough) {
    children = <s>{children}</s>;
  }

  return (
    <span
      {...attributes}
      className={cn(
        Object.keys(rest).join(" "),
        "fakeSelection" in leaf && leaf.fakeSelection && "bg-sky-600",
      )}
    >
      {children}
    </span>
  );
};
