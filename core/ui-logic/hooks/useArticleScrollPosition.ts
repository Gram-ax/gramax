import type { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import { useEffect, useLayoutEffect } from "react";

const useArticleScrollPosition = (data: ArticlePageData) => {
	const articleRef = ArticleRefService.value;
	const { getPosition, setPosition } = useScrollPositionStore();
	const currentArticlePath = data?.articleProps?.ref?.path;

	useLayoutEffect(() => {
		if (!articleRef?.current || !currentArticlePath) return;

		const hasAnchor = window.location.hash.length > 1;
		if (hasAnchor) return;

		const savedPosition = getPosition(currentArticlePath);

		if (savedPosition) {
			requestAnimationFrame(() => {
				if (articleRef.current) {
					articleRef.current.scrollTop = savedPosition;
				}
			});
		} else {
			articleRef.current.scrollTop = 0;
		}
	}, [currentArticlePath, articleRef, getPosition]);

	useEffect(() => {
		if (!articleRef?.current || !currentArticlePath) return;

		const handleScroll = () => {
			if (articleRef.current) {
				setPosition(currentArticlePath, articleRef.current.scrollTop);
			}
		};

		const scrollElement = articleRef.current;
		scrollElement.addEventListener("scroll", handleScroll, { passive: true });

		return () => {
			scrollElement.removeEventListener("scroll", handleScroll);
		};
	}, [currentArticlePath, articleRef, setPosition]);
};

export default useArticleScrollPosition;
