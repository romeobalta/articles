"use client";

import { ArticlesList } from "@/components/articles-list";
import { Editor } from "@/components/editor";
import { Sidebar } from "@/components/sidebar";
import React from "react";
import { AppProvider } from "./app-context";

export default function EntryPage() {
  return (
    <AppProvider>
      <div className="w-screen min-h-screen flex flex-row">
        <Sidebar>
          <h1 className="text-lg font-bold text-skin-primary">Articles</h1>
          <ArticlesList />
        </Sidebar>

        <Editor />

        <Sidebar type="right">
          <span>test</span>
        </Sidebar>
      </div>
    </AppProvider>
  );
}
