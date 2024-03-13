import { cn } from "@/lib/utils";
import { useSelected, useSlateStatic } from "slate-react";
import { CustomElement } from "./editor-types";

export const DEFAULT_PLACEHOLDER = "Type anything, '/' for commands...";

interface PlaceholderProps {
  element: CustomElement;
  className?: string;
  showAlways?: boolean;
}

export const Placeholder = ({
  element,
  className,
  showAlways = false,
}: PlaceholderProps) => {
  const editor = useSlateStatic();
  const selected = useSelected();

  return (showAlways || selected) &&
    editor.isEmpty(element) &&
    "placeholder" in element &&
    element.placeholder ? (
    <span
      className={cn(
        "pointer-events-none absolute left-0.5 top-0 z-0 select-none text-slate-400",
        className,
      )}
      contentEditable={false}
    >
      {element.placeholder}
    </span>
  ) : null;
};
