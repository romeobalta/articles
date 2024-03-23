"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";
import React from "react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";

type SidebarProps = {
  children: React.ReactNode;
  type?: "left" | "right";
};

export function Sidebar({ children, type = "left" }: SidebarProps) {
  const [open, setOpen] = React.useState(true);

  return (
    <div
      className={cn(
        "relative h-screen py-10 px-8",
        open ? "w-64" : "w-4 px-2",
        "transition-all duration-300 ease-in-out ",
      )}
    >
      <Badge
        className={cn(
          "absolute top-10 px-1 py-1",
          type === "left"
            ? "right-0 translate-x-1/2"
            : "left-0 -translate-x-1/2",
        )}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        {(open && type === "left") || (!open && type === "right") ? (
          <ChevronLeftIcon />
        ) : (
          <ChevronRightIcon />
        )}
      </Badge>

      <div className="overflow-y-auto overflow-x-hidden">
        <div className="w-64 ">{children}</div>
      </div>
    </div>
  );
}
