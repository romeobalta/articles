import React from "react";

import { cn } from "@/lib/cn";
import { keepInsideViewport } from "./lib";

// interface Position {
//   top: number
//   left: number
// }

interface ModalProps {
  children?: React.ReactNode;
  attachTo?: DOMRect | null;
  attachAt?: "top" | "bottom";
  // position?: Position
  className?: string;
  offset?: number;
  onAttach?: () => void;
}

export const Modal = ({
  children,
  attachTo,
  attachAt = "top",
  className,
  offset,
  onAttach,
}: ModalProps) => {
  const modalRef = React.useRef<HTMLDivElement>(null);

  const [{ top, left }, setPosition] = React.useState({
    top: -10000,
    left: -10000,
  });

  React.useEffect(() => {
    if (top === -10000 && left === -10000) {
      return;
    }

    if (!onAttach || !attachTo) {
      return;
    }

    onAttach();
  }, [top, left, onAttach, attachTo]);

  React.useEffect(() => {
    if (attachTo) {
      const modalRect = modalRef.current?.getBoundingClientRect();

      if (modalRect) {
        const { top, left } = keepInsideViewport(
          modalRect,
          attachTo,
          attachAt,
          offset,
        );

        setPosition({ top, left });
        return;
      }
    }

    setPosition({ top: -10000, left: -10000 });
  }, [attachAt, attachTo, offset]);

  return (
    <div
      className={cn(
        "absolute z-50 max-h-64 overflow-y-auto rounded-md text-sm shadow-md",
        className,
      )}
      style={{
        top,
        left,
      }}
      ref={modalRef}
    >
      {children}
    </div>
  );
};
