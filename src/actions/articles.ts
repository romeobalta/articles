"use server";

import { CustomElement } from "@/components/editor/editor-types";
import * as fs from "node:fs/promises";

interface Article {
  title: string;
  blocks: CustomElement[];
}

type ArticleFile = {
  file: string;
  data: Article;
};

export type ArticleFiles = ArticleFile[];

export async function getArticles() {
  try {
    await fs.access("./.articles");
  } catch (e) {
    await fs.mkdir("./.articles");
  }

  const files = await fs.readdir("./.articles");
  const articles = await Promise.all(
    files
      .filter((file) => {
        return file.endsWith(".json");
      })
      .map(async (file) => {
        const content = await fs.readFile(`./.articles/${file}`, "utf-8");
        const article = JSON.parse(content) as Article;
        return { file, data: article };
      }),
  );

  return articles;
}
