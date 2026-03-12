import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import safeDecode from "@core/utils/safeDecode";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useEffect, useRef } from "react";

const useScrollToArticleAnchor = (data: ArticlePageData) => {
	const _data = useRef<ArticlePageData>();
	const articleRef = ArticleRefService.value;
	const timeout = useRef(null);

	useEffect(() => {
		(() => {
			if (data === _data.current) return;
			if (!articleRef.current) return;

			const anchorId = window.location.hash.substring(1);
			if (!anchorId) return;

			_data.current = data;

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
			_data.current = null;
			if (timeout.current) clearTimeout(timeout.current);
		};
	}, [data]);
};

export default useScrollToArticleAnchor;
