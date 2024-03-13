import React from "react";

import { BaseRange, Editor, Element, Path, Range, Transforms } from "slate";
import { ReactEditor, useSlate, useSlateStatic } from "slate-react";

import { cn } from "@/lib/utils";

import { CustomText, LinkElement } from "./editor-types";
import { Modal } from "./modal";

export interface HoveringToolbarRef {
  onKey: (event: React.KeyboardEvent<HTMLDivElement>) => boolean;
  getDOMNode: () => HTMLDivElement | null;
}

export interface HoveringToolbarProps {
  setFakeSelection: (range: BaseRange | null) => void;
  fakeSelection: BaseRange | null;
}

type Marks = keyof Omit<CustomText, "text">;

export const HoveringToolbar = React.forwardRef<
  HoveringToolbarRef,
  HoveringToolbarProps
>(({ fakeSelection, setFakeSelection }, ref) => {
  const editor = useSlate();

  const toolbarRef = React.useRef<HTMLDivElement>(null);
  const linkInputRef = React.useRef<HTMLInputElement>(null);
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldSkipAttach = React.useRef(false);

  const [toolbarAttachedTo, setToolbarAttachedTo] =
    React.useState<DOMRect | null>(null);
  const [linkModalAttachedTo, setLinkModalAttachedTo] =
    React.useState<DOMRect | null>(null);

  const hideToolbar = React.useCallback(() => {
    setToolbarAttachedTo(null);
  }, []);

  const hideLinkModal = React.useCallback(
    (noSelect?: boolean) => {
      setLinkModalAttachedTo(null);

      if (fakeSelection) {
        if (!noSelect) {
          Transforms.select(editor, fakeSelection);
          ReactEditor.focus(editor);
        }
        setFakeSelection(null);
      }
    },
    [editor, fakeSelection, setFakeSelection],
  );

  const blur = React.useCallback(
    (event: MouseEvent) => {
      if (linkModalAttachedTo) {
        event.preventDefault();
        event.stopPropagation();

        hideLinkModal();
        shouldSkipAttach.current = true;

        return;
      }

      hideToolbar();
    },
    [hideLinkModal, hideToolbar, linkModalAttachedTo],
  );

  const isInASingleBlock = React.useCallback(() => {
    const { selection } = editor;

    if (!selection && !fakeSelection) {
      return false;
    }

    const [start, end] = Range.edges(selection ?? fakeSelection!);

    return Path.equals(start.path, end.path);
  }, [editor, fakeSelection]);

  const attachToolbar = React.useCallback(
    (event: MouseEvent) => {
      // We just blurred the link modal, the toolbar will be attached already
      if (shouldSkipAttach.current) {
        event.preventDefault();
        event.stopPropagation();
        shouldSkipAttach.current = false;
        return;
      }

      debounceRef.current && clearTimeout(debounceRef.current);

      if (!ReactEditor.isFocused(editor)) {
        return;
      }

      if (
        event.target instanceof HTMLElement ||
        event.target instanceof SVGElement
      ) {
        if (toolbarRef.current?.contains(event.target)) {
          return;
        }
      }

      debounceRef.current = setTimeout(() => {
        const { selection } = editor;

        if (selection && !Range.isCollapsed(selection)) {
          const domSelection = window.getSelection();
          if (domSelection) {
            const domRange = domSelection.getRangeAt(0);
            const rect = domRange.getBoundingClientRect();

            setToolbarAttachedTo(rect);
            return;
          }
        }
      }, 400);
    },
    [editor],
  );

  const preserveSelection = React.useCallback(() => {
    const { selection } = editor;

    if (!selection) {
      return;
    }

    setFakeSelection(selection);
  }, [editor, setFakeSelection]);

  const focusLinkInput = React.useCallback(() => {
    preserveSelection();

    linkInputRef.current?.focus();
  }, [preserveSelection]);

  const isLinkActive = React.useCallback(() => {
    const [link] = Editor.nodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === "link",
    });
    return !!link;
  }, [editor]);

  const unwrapLink = React.useCallback(() => {
    Transforms.unwrapNodes(editor, {
      match: (n) =>
        !Editor.isEditor(n) && Element.isElement(n) && n.type === "link",
    });
  }, [editor]);

  const wrapLink = React.useCallback(
    (url: string) => {
      const isCollapsed = !fakeSelection;
      const link: LinkElement = {
        type: "link",
        url,
        children: isCollapsed ? [{ text: url }] : [],
      };

      if (isCollapsed) {
        Transforms.insertNodes(editor, link);
      } else {
        Transforms.wrapNodes(editor, link, { split: true });
        Transforms.collapse(editor, { edge: "end" });
      }
    },
    [editor, fakeSelection],
  );

  React.useEffect(() => {
    document.addEventListener("mouseup", attachToolbar);
    document.addEventListener("mousedown", blur);

    return () => {
      document.removeEventListener("mouseup", attachToolbar);
      document.removeEventListener("mousedown", blur);
    };
  }, [attachToolbar, blur, hideToolbar]);

  const onKey = React.useCallback(
    (_event: React.KeyboardEvent<HTMLDivElement>) => {
      hideToolbar();
      return false;
    },
    [hideToolbar],
  );

  React.useImperativeHandle(ref, () => ({
    onKey,

    getDOMNode: () => toolbarRef.current,
  }));

  return (
    <div ref={toolbarRef}>
      <Modal
        attachTo={toolbarAttachedTo}
        attachAt="bottom"
        className="bg-skin-base flex overflow-hidden border border-slate-300 shadow-md"
      >
        {isInASingleBlock() && (
          <>
            <ToolbarGroup>
              <ToolbarButton
                icon="Link"
                action={() => {
                  setLinkModalAttachedTo(toolbarAttachedTo);
                }}
              />
            </ToolbarGroup>
          </>
        )}
        <ToolbarGroup>
          <ToolbarButton
            icon={<span>b</span>}
            className="font-bold uppercase"
            action="mark"
            params={{ format: "bold" }}
          />
          <ToolbarButton
            icon={<span>i</span>}
            className="italic"
            action="mark"
            params={{ format: "italic" }}
          />
          <ToolbarButton
            icon={<span>u</span>}
            className="uppercase underline"
            action="mark"
            params={{ format: "underline" }}
          />
          <ToolbarButton
            icon={<span>s</span>}
            className="uppercase line-through"
            action="mark"
            params={{ format: "strikethrough" }}
          />
        </ToolbarGroup>
      </Modal>

      <Modal
        attachTo={linkModalAttachedTo}
        attachAt="bottom"
        className="w-80"
        onAttach={focusLinkInput}
      >
        <div className="px-1 py-1">
          <input
            type="text"
            className="w-full rounded px-2 py-1 text-slate-100 placeholder:text-sm"
            placeholder="Paste link or search pages"
            ref={linkInputRef}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.stopPropagation();

                hideLinkModal();
                wrapLink(linkInputRef.current?.value ?? "");
              }

              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();

                hideLinkModal();
              }
            }}
          />
        </div>
      </Modal>
    </div>
  );
});
HoveringToolbar.displayName = "HoveringToolbar";

interface ToolbarButtonProps {
  icon: React.ReactNode;
  action: "mark" | Function;
  params?: {
    format: Marks;
  };
  dropdown?: boolean;
  className?: string;
}

const ToolbarButton = ({
  icon,
  action,
  params,
  dropdown,
  className,
}: ToolbarButtonProps) => {
  const editor = useSlateStatic();

  const isMarkActive = React.useCallback(
    (format: Marks) => {
      const marks = Editor.marks(editor) as CustomText | null;
      return marks?.[format] === true;
    },
    [editor],
  );

  const toggleMark = React.useCallback(
    (format: Marks) => {
      const isActive = isMarkActive(format);

      if (isActive) {
        Editor.removeMark(editor, format);
      } else {
        Editor.addMark(editor, format, true);
      }
    },
    [editor, isMarkActive],
  );

  return (
    <button
      className={cn(
        "inline-flex items-center justify-stretch gap-0.5 px-2 py-1 hover:bg-slate-300",
        dropdown && "pr-1",
        className,
        action === "mark" &&
          params?.format &&
          isMarkActive(params.format) &&
          "text-sky-500",
      )}
      onMouseDown={(event) => {
        event.preventDefault();
        event.stopPropagation();

        if (action === "mark") {
          if (params) {
            toggleMark(params.format);
          }
        }

        if (typeof action === "function") {
          action();
        }
      }}
    >
      {icon}
      {dropdown && (
        <svg className="h-5 w-5" viewBox="5 0 10 20" fill="currentColor">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M6.293 9a1 1 0 011.414 0L10 11.293l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
            fill="currentColor"
          />
        </svg>
      )}
    </button>
  );
};

const ToolbarGroup = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex border-r border-x-slate-300 last:border-r-0 ">
      {children}
    </div>
  );
};
