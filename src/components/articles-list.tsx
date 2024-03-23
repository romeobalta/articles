"use client";

import { useApp } from "@/app/app-context";
import React from "react";

export function ArticlesList() {
  const { articles } = useApp();

  return (
    <>
      {articles.map((article) => (
        <div key={article.file} className="text-sm">
          {article.data.title}
        </div>
      ))}
    </>
  );
}
