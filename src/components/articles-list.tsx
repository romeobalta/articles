import { getArticles } from "@/actions/articles";

export async function ArticlesList() {
  const articles = await getArticles();

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
