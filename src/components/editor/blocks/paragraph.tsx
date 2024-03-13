import { cn } from "@/lib/utils";
import { RenderElementProps } from "slate-react";
import { DEFAULT_PLACEHOLDER, Placeholder } from "../placeholder";

export const PARAGRAPH = {
  name: "Paragraph",
  type: "paragraph" as const,
  children: [{ text: "" }],
  placeholder: DEFAULT_PLACEHOLDER,
  selected: false,
};

interface ParagraphProps extends RenderElementProps {
  className?: string;
}

export const Paragraph = ({
  attributes,
  children,
  element,
  className,
}: ParagraphProps) => {
  return (
    <div className={cn("relative", className)}>
      <Placeholder element={element} />
      <div {...attributes} className="z-10">
        {children}
      </div>
    </div>
  );
};
