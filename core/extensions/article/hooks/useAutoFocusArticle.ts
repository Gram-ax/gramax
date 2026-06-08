import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import { useLayoutEffect } from "react";

export const useAutoFocusArticle = () => {
	const articleRef = ArticleRefService.value;
	const pathname = useArticlePropsStore((state) => state.data?.pathname);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useLayoutEffect(() => {
		articleRef.current?.focus({ preventScroll: true });
	}, [pathname]);
};
