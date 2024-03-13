import { cn } from "@/lib/cn";
import { RenderElementProps } from "slate-react";
import { Placeholder } from "../placeholder";

export const BLOCKQUOTE = {
  name: "Blockquote",
  type: "blockquote" as const,
  placeholder: "Empty quote",
  selected: false,
  children: [{ text: "" }],
};

interface BlockquoteProps extends RenderElementProps {
  className?: string;
}

export const Blockquote = ({
  attributes,
  children,
  element,
  className,
}: BlockquoteProps) => {
  return (
    <div className={cn("relative py-2", className)}>
      <Placeholder element={element} showAlways className="!left-7 top-2" />
      <div {...attributes} className="border-l-4 border-white pl-5">
        {children}
      </div>
    </div>
  );
};
