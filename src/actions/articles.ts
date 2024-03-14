"use server";

import * as fs from "node:fs/promises";

interface Article {
  title: string;
  blocks: string;
}

export async function getArticles() {
  // check if directory exists, if not, create it
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
