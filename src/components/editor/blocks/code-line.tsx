import { cn } from "@/lib/utils";
import { RenderElementProps } from "slate-react";
import { CodeLineElement } from "../editor-types";

export const CODELINE = {
  name: "CodeLine",
  type: "code-line" as const,
  children: [{ text: "" }],
};

interface CodeLineProps extends RenderElementProps {
  element: CodeLineElement;
  className?: string;
}

export const CodeLine = ({
  attributes,
  children,
  element,
  className,
}: CodeLineProps) => {
  return (
    <div className={cn("relative w-full", className)}>
      <span {...attributes} className="z-10">
        {children}
      </span>
    </div>
  );
};
