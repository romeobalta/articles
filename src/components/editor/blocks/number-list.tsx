import { RenderElementProps } from "slate-react";
import { cn } from "@/lib/utils";
import { LISTITEM } from "./list-item";

export const NUMBERLIST = {
  name: "Number List",
  type: "number-list" as const,
  children: [LISTITEM],
};

interface NumberListProps extends RenderElementProps {
  className?: string;
}

export const NumberList = ({
  attributes,
  children,
  className,
}: NumberListProps) => {
  return (
    <ol
      {...attributes}
      className={cn(
        "z-10 select-none list-inside list-decimal px-0",
        className,
      )}
    >
      {children}
    </ol>
  );
};
