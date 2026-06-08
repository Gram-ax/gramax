import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import safeDecode from "@core/utils/safeDecode";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useEffect, useRef } from "react";

const useScrollToArticleAnchor = (data: ArticlePageData) => {
	const Data = useRef<ArticlePageData>();
	const articleRef = ArticleRefService.value;
	const timeout = useRef(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		(() => {
			if (data === Data.current) return;
			if (!articleRef.current) return;

			const anchorId = window.location.hash.substring(1);
			if (!anchorId) return;

			Data.current = data;

			const getElemAndScroll = () => {
				const anchorId = window.location.hash.substring(1);
				if (!anchorId) {
					if (articleRef.current) articleRef.current.scroll();
					return;
				}

				const anchor = articleRef.current.querySelector(`#${CSS.escape(safeDecode(anchorId))}`);

				if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
			};

			timeout.current = setTimeout(getElemAndScroll, 150);
		})();

		return () => {
			Data.current = null;
			if (timeout.current) clearTimeout(timeout.current);
		};
	}, [data]);
};

export default useScrollToArticleAnchor;
