import { cn } from "@/lib/utils";
import { RenderElementProps } from "slate-react";
import { CustomElement } from "../editor-types";
import { Placeholder } from "../placeholder";

interface HeadingProps extends RenderElementProps {
  element: Extract<CustomElement, { type: "heading" }>;
  className?: string;
}

type HeadingTag = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export const HEADING = (level: 1 | 2 | 3 | 4 | 5 | 6) => ({
  type: "heading" as const,
  level: level,
  selected: false,
  placeholder: `Heading ${level}`,
});

export const HEADINGS = [
  {
    ...HEADING(1),
    name: "Heading 1",
  },
  {
    ...HEADING(2),
    name: "Heading 2",
  },
  {
    ...HEADING(3),
    name: "Heading 3",
  },
  {
    ...HEADING(4),
    name: "Heading 4",
  },
  {
    ...HEADING(5),
    name: "Heading 5",
  },
  {
    ...HEADING(6),
    name: "Heading 6",
  },
];

export const Heading = ({
  attributes,
  children,
  element,
  className,
}: HeadingProps) => {
  const HeadingTag = `h${element.level ?? "1"}` as HeadingTag;

  let textStyle = "text-3xl font-bold my-4 text-skin-primary";
  if (element.level === 2) {
    textStyle = "text-2xl font-bold my-4";
  } else if (element.level === 3) {
    textStyle = "text-xl font-bold my-4";
  } else if (element.level === 4) {
    textStyle = "text-lg font-bold my-4";
  } else if (element.level === 5) {
    textStyle = "text-base font-bold my-4";
  } else if (element.level === 6) {
    textStyle = "text-sm font-bold my-4";
  }

  return (
    <div className={cn("relative", textStyle, className)}>
      <Placeholder element={element} showAlways />
      <HeadingTag {...attributes} className="z-10">
        {children}
      </HeadingTag>
    </div>
  );
};
