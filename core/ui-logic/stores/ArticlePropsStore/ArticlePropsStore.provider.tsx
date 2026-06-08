import type { ClientArticleProps } from "@core/SitePresenter/SitePresenter";
import { type ArticlePropsStore, createArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore";
import { createContext, type ReactNode, useContext, useEffect, useRef } from "react";
import { shallow } from "zustand/shallow";
import { useStoreWithEqualityFn } from "zustand/traditional";

type ArticlePropsStoreApi = ReturnType<typeof createArticlePropsStore>;

const ArticlePropsStoreContext = createContext<ArticlePropsStoreApi | undefined>(undefined);

interface ArticlePropsStoreProviderProps {
	children: ReactNode;
	data: ClientArticleProps;
}

export const ArticlePropsStoreProvider = ({ children, data }: ArticlePropsStoreProviderProps) => {
	const storeRef = useRef<ArticlePropsStoreApi>(null);

	if (storeRef.current === null) {
		storeRef.current = createArticlePropsStore({ data });
	}

	useEffect(() => {
		storeRef.current?.setState({ data });
	}, [data]);

	if (storeRef.current === null) return null;
	return <ArticlePropsStoreContext.Provider value={storeRef.current}>{children}</ArticlePropsStoreContext.Provider>;
};

export const useArticlePropsStore = <T,>(
	selector: (store: ArticlePropsStore) => T,
	equalityFn?: ((a: T, b: T) => boolean) | "shallow",
): T => {
	const articleUpdateStoreContext = useContext(ArticlePropsStoreContext);
	if (!articleUpdateStoreContext) return selector(null as unknown as ArticlePropsStore);

	const actualEqualityFn = equalityFn === "shallow" ? shallow : equalityFn;
	return useStoreWithEqualityFn(articleUpdateStoreContext, selector, actualEqualityFn);
};
