import { ArticlesList } from "@/components/articles-list";
import { Editor } from "@/components/editor";
import { Sidebar } from "@/components/sidebar";
import React, { Suspense } from "react";

export default function EntryPage() {
  return (
    <div className="w-screen min-h-screen flex flex-row">
      <Sidebar>
        <h1 className="text-lg font-bold text-skin-primary">Articles</h1>
        <Suspense fallback={<div>Loading...</div>}>
          <ArticlesList />
        </Suspense>
      </Sidebar>

      <Editor />

      <Sidebar type="right">
        <span>test</span>
      </Sidebar>
    </div>
  );
}
