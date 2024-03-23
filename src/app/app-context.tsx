"use client";

import { getArticles } from "@/actions/articles";
import React from "react";

const AppContext = React.createContext<ReturnType<
  typeof useAppProvider
> | null>(null);

const useAppProvider = () => {
  const [articles, setArticles] = React.useState<
    Awaited<ReturnType<typeof getArticles>>
  >([]);

  React.useEffect(() => {
    async function fetchArticles() {
      const articles = await getArticles();

      console.log(articles);

      setArticles(articles);
    }

    fetchArticles();
  }, []);

  const value = React.useMemo(() => {
    return { articles };
  }, [articles]);

  return value;
};

interface AppProviderProps {
  children: React.ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const value = useAppProvider();

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = React.useContext(AppContext);

  if (!context) {
    throw new Error("useApp must be used within a AppProvider");
  }

  return context;
}
