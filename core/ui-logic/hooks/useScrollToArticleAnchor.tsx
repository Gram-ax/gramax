import createAwaiter from "@core-ui/utils/createAwaiter";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import { useEffect, useRef } from "react";

const useScrollToArticleAnchor = (data: ArticlePageData) => {
	const _data = useRef<ArticlePageData>();

	useEffect(() => {
		setTimeout(() => {
			const anchorId = window.location.hash.substring(1);
			if (!anchorId) return;

			if (data === _data.current) return;
			_data.current = data;

			createAwaiter(20, () => {
				const anchor = document.getElementById(decodeURI(anchorId));
				if (!anchor) return false;

				anchor.scrollIntoView({ behavior: "smooth" });
				return true;
			});
		}, 150);
	}, [data]);
};

export default useScrollToArticleAnchor;
