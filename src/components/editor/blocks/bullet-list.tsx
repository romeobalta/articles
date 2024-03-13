import { cn } from "@/lib/cn";
import { RenderElementProps } from "slate-react";
import { LISTITEM } from "./list-item";

export const BULLETLIST = {
  name: "Bullet List",
  type: "bullet-list" as const,
  children: [LISTITEM],
};

interface BulletListProps extends RenderElementProps {
  className?: string;
}

export const BulletList = ({
  attributes,
  children,
  className,
}: BulletListProps) => {
  return (
    <ul
      {...attributes}
      className={cn("z-10 list-inside list-disc px-0", className)}
    >
      {children}
    </ul>
  );
};
