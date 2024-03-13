import React from "react";

import { Transforms } from "slate";
import { MERGING } from "slate-history";
import { useSlateStatic } from "slate-react";

import { cn } from "@/lib/cn";
import { BlockHandlers } from "./lib";

import { BLOCKS } from "./block";

type BlockPicker = {
  type: "block";
  elements: typeof BLOCKS;
};

type PagePicker = {
  type: "page";
  elements: {
    title: string;
    link: string;
  }[];
};

type Picker = BlockPicker | PagePicker;
type PickerType = Picker["type"];

interface GeneralPickerProps {}
export interface GeneralPickerRef {
  onKey: (event: React.KeyboardEvent<HTMLDivElement>) => boolean;
}

// TODO: keep it viewport
// rename this to SlashCommandPicker or something similar
export const GeneralPicker = React.forwardRef<GeneralPickerRef>(
  (_: GeneralPickerProps, ref) => {
    const editor = useSlateStatic();

    const [{ top, left }, setPosition] = React.useState({
      top: -10000,
      left: -10000,
    });
    const [search, setSearch] = React.useState("");
    const [selected, setSelected] = React.useState(0);

    const [picker, setPicker] = React.useState<PickerType | null>(null);

    const elementRef = React.useRef<HTMLDivElement>(null);
    const scrollRef = React.useRef<HTMLDivElement>(null);

    const blockHandlers = React.useMemo(
      () => new BlockHandlers(editor),
      [editor],
    );

    const openPicker = React.useCallback(
      (type?: PickerType) => {
        const selection = editor.selection;
        setPicker(type ?? "block");

        if (!selection) {
          return;
        }

        const domSelection = window.getSelection();

        if (!domSelection) {
          return;
        }

        const domRange = domSelection.getRangeAt(0);
        const rect = domRange.getBoundingClientRect();

        setPosition({
          top: rect.top + window.scrollY + 24,
          left: rect.left + window.scrollX,
        });
      },
      [editor.selection],
    );

    const closePicker = React.useCallback(() => {
      setPosition({ top: -10000, left: -10000 });
      setSelected(0);
      setSearch("");
      setPicker(null);
    }, []);

    const closeIfOutside = React.useCallback(
      (event: MouseEvent) => {
        if (elementRef.current?.contains(event.target as Node)) {
          return;
        }

        closePicker();
      },
      [closePicker],
    );
    React.useEffect(() => {
      document.addEventListener("mousedown", closeIfOutside);

      return () => {
        document.removeEventListener("mousedown", closeIfOutside);
      };
    }, [closeIfOutside]);

    const isOpen = React.useMemo(
      () => top !== -10000 && left !== -10000,
      [top, left],
    );

    const elementsOfCurrentPicker = React.useMemo(() => {
      if (picker === "block") {
        return BLOCKS;
      }

      return [];
    }, [picker]);

    const filteredElements = React.useMemo(() => {
      console.log(elementsOfCurrentPicker, search);

      if (!search) {
        return elementsOfCurrentPicker;
      }

      setSelected(0);

      return elementsOfCurrentPicker.filter((element) =>
        element.name.toLowerCase().includes(search.toLowerCase()),
      );
    }, [elementsOfCurrentPicker, search]);

    const insertSelectedBlock = React.useCallback(() => {
      editor.writeHistory("undos", {
        operations: [],
        selectionBefore: editor.selection,
      });
      MERGING.set(editor, true);

      Transforms.delete(editor, {
        unit: "character",
        distance: search.length + 1,
        reverse: true,
      });

      blockHandlers.changeOrInsertBlock(filteredElements[selected]);
      closePicker();
    }, [
      blockHandlers,
      closePicker,
      editor,
      filteredElements,
      search.length,
      selected,
    ]);

    const insertSelectedElement = React.useCallback(() => {
      if (picker === "block") {
        insertSelectedBlock();
      }
    }, [insertSelectedBlock, picker]);

    const onKey = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        const { key } = event;
        if (event.key === "/") {
          openPicker("block");
        }

        if (isOpen) {
          if (key === "ArrowDown") {
            event.preventDefault();
            setSelected((selected) =>
              selected < elementsOfCurrentPicker.length - 1 ? selected + 1 : 0,
            );
          }

          if (key === "ArrowUp") {
            event.preventDefault();
            setSelected((selected) =>
              selected > 0 ? selected - 1 : elementsOfCurrentPicker.length - 1,
            );
          }

          if (key === "ArrowLeft" || key === "ArrowRight") {
            event.preventDefault();
            closePicker();
          }

          if (key === "Enter") {
            event.preventDefault();
            insertSelectedElement();
            return true;
          }

          if (key.match("^[a-zA-Z0-9]$")) {
            setSearch((search) => search + key);
          }

          if (key === "Backspace") {
            if (search.length > 0) {
              setSearch((search) => search.slice(0, -1));
              return true;
            }

            closePicker();
          }

          if (key === "Escape") {
            event.preventDefault();
            closePicker();
          }

          return true;
        }

        return false;
      },
      [
        closePicker,
        elementsOfCurrentPicker.length,
        insertSelectedElement,
        isOpen,
        openPicker,
        search.length,
      ],
    );

    // Keep selection in view
    React.useEffect(() => {
      if (!scrollRef.current) {
        return;
      }

      const rect = scrollRef.current.getBoundingClientRect();
      const containerRect =
        scrollRef.current.parentElement?.getBoundingClientRect();

      if (
        containerRect &&
        !(rect.bottom <= containerRect.top || rect.top >= containerRect.bottom)
      ) {
        scrollRef.current.scrollIntoView({
          block: "nearest",
        });
      }
    }, [selected]);

    React.useImperativeHandle(ref, () => ({
      onKey,
    }));

    return (
      <div
        className="absolute z-20 max-h-64 overflow-y-auto rounded-md bg-white text-sm shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
        style={{
          top,
          left,
        }}
        ref={elementRef}
      >
        <div className="h-fit w-60 overflow-scroll py-2">
          <div className="px-4 py-1 text-xs text-slate-500">Blocks</div>
          {filteredElements.map((block, index) => (
            <div
              key={block.type + index}
              className={cn(
                "cursor-pointer px-4 py-2",
                index === selected
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-700",
                "block px-4 py-2 text-sm",
              )}
              onMouseEnter={() => setSelected(index)}
              onClick={() => insertSelectedElement()}
              ref={index === selected ? scrollRef : undefined}
            >
              {block.name}
            </div>
          ))}
        </div>
      </div>
    );
  },
);
GeneralPicker.displayName = "GeneralPicker";
