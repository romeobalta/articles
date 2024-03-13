"use client";

import { Editor } from "@/components/editor";
import React from "react";

export default function EntryPage() {
  const [title, setTitle] = React.useState("");

  return (
    <>
      <Editor title={title ?? ""} setTitle={setTitle} />
    </>
  );
}
