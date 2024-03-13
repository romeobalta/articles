import { cn } from "@/lib/utils";
import { RenderElementProps } from "slate-react";
import { Placeholder } from "../placeholder";

export const LISTITEM = {
  name: "ListItem",
  type: "list-item" as const,
  children: [{ text: "" }],
  placeholder: "Empty list item",
  selected: false,
};

interface ListItemProps extends RenderElementProps {
  className?: string;
}

export const ListItem = ({
  attributes,
  children,
  element,
  className,
}: ListItemProps) => {
  return (
    <li className={cn("relative w-full pl-4", className)}>
      <Placeholder element={element} className="!left-10" />
      <span {...attributes} className="z-10 inline-block w-[calc(100%-40px)]">
        {children}
      </span>
    </li>
  );
};
