import { cn } from "@/lib/utils";
import { RenderElementProps } from "slate-react";
import { CodeElement } from "../editor-types";

export const CODE = {
  name: "Code",
  type: "code" as const,
  language: "tsx",
  children: [{ text: "" }],
  placeholder: "Empty code block",
  selected: false,
};

interface CodeProps extends RenderElementProps {
  className?: string;
  element: CodeElement;
}

export const Code = ({
  attributes,
  children,
  className,
  element,
}: CodeProps) => {
  const lineNumbers = element.children.length;

  // const lineNumbersWidth = lineNumbers.toString().length * 0.5 + 0.5

  return (
    <div
      className={cn(
        "jetbrains-mono relative z-10 bg-neutral-900 font-mono text-sm",
        `language-${element.language} line-numbers pointer-events-none select-none text-white`,
        className,
      )}
    >
      <span
        className="line-numbers-rows pointer-events-none absolute left-0.5 top-5 z-0 select-none text-[#7c6f64]"
        style={{
          width: `2rem`,
        }}
        contentEditable={false}
      >
        {Array.from(Array(lineNumbers).keys()).map((i) => (
          <span key={i} className="line-number my-0.5 text-right"></span>
        ))}
      </span>
      <div
        {...attributes}
        className="pointer-events-none block select-none p-5"
        style={{ paddingLeft: `2.25rem` }}
      >
        {children}
      </div>
    </div>
  );
};
