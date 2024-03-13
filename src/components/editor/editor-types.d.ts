import { BaseEditor, BaseRange } from "slate"
import { HistoryEditor } from "slate-history"
import { ReactEditor } from "slate-react"

// ADD TYPES HERE
type CustomEditor = BaseEditor &
  ReactEditor &
  HistoryEditor & {
    codeblocksDecorations: Map<CodeLineElement, BaseRange[]>
  }

type PlaceHolderElement = { placeholder?: string }
type SelectedElement = { selected?: boolean }

type ParagraphElement = {
  type: "paragraph"
  children: CustomText[]
} & PlaceHolderElement &
  SelectedElement

type HeadingElement = {
  type: "heading"
  children: CustomText[]
  level: 1 | 2 | 3 | 4 | 5 | 6
} & PlaceHolderElement &
  SelectedElement

type BlockquoteElement = {
  type: "blockquote"
  children: CustomText[]
} & PlaceHolderElement &
  SelectedElement

type ListItemElement = {
  type: "list-item"
  children: CustomText[]
} & PlaceHolderElement &
  SelectedElement

type BulletListElement = {
  type: "bullet-list"
  children: ListItemElement[]
}

type NumberListElement = {
  type: "number-list"
  children: ListItemElement[]
}

export type CodeLineElement = {
  type: "code-line"
  children: CustomText[]
}

type CodeElement = {
  type: "code"
  language: string
  children: CodeLineElement[]
} & PlaceHolderElement &
  SelectedElement

type LinkElement = {
  type: "link"
  url: string
  children: CustomText[]
}

type SelectableElement =
  | HeadingElement
  | ParagraphElement
  | BlockquoteElement
  | ListItemElement
  | CodeElement

type ListElement = BulletListElement | NumberListElement

type ContainerElement = ListElement | CodeElement

type InlineElement = LinkElement

type CustomElement =
  | SelectableElement
  | ContainerElement
  | InlineElement
  | CodeLineElement

type EmptyText = { text: string }
type CustomText = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strikethrough?: boolean
  code?: boolean
  fakeSelection?: boolean
}

type CustomLeaf = CustomText | EmptyText

declare module "slate" {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomLeaf
  }
}
