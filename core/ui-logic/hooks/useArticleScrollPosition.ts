import type { ArticlePageData } from "@core/SitePresenter/types/ArticlePage";
import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import { useEffect, useLayoutEffect, useRef } from "react";

const useArticleScrollPosition = (data: ArticlePageData) => {
	const articleRef = ArticleRefService.value;
	const { getPosition, setPosition, setProgrammaticScroll } = useScrollPositionStore();
	const isProgrammaticScroll = useScrollPositionStore((s) => s.isProgrammaticScroll);
	const isProgrammaticScrollRef = useRef(false);
	isProgrammaticScrollRef.current = isProgrammaticScroll;
	const currentArticlePath = data?.articleProps?.ref?.path;

	useLayoutEffect(() => {
		const el = articleRef?.current;
		if (!el || !currentArticlePath) return;
		if (window.location.hash.length > 1) return;
		// window.location.hash strips the fragment directive, so check the raw navigation URL
		const navUrl = (performance.getEntriesByType("navigation") as PerformanceNavigationTiming[])[0]?.name ?? "";
		if (navUrl.includes(":~:")) return;

		const savedPosition = getPosition(currentArticlePath);

		if (savedPosition == null) {
			el.scrollTop = 0;
			return;
		}

		let active = true;
		let restoreTimeout: ReturnType<typeof setTimeout> | null = null;
		let observer: MutationObserver | null = null;
		let resizeObserver: ResizeObserver | null = null;

		const stopRestoring = () => {
			if (!active) return;
			active = false;
			setProgrammaticScroll(false);
			observer?.disconnect();
			resizeObserver?.disconnect();
			if (restoreTimeout) clearTimeout(restoreTimeout);
		};

		const armStopTimer = () => {
			if (!active) return;
			if (restoreTimeout) clearTimeout(restoreTimeout);
			restoreTimeout = setTimeout(stopRestoring, 300);
		};

		const enforceSavedPosition = () => {
			if (!active) return;
			if (Math.abs(el.scrollTop - savedPosition) > 1) {
				el.scrollTop = savedPosition;
			}
			armStopTimer();
		};

		observer = new MutationObserver(() => {
			enforceSavedPosition();
		});
		observer.observe(el, { subtree: true, childList: true, attributes: true });

		const contentWrapper = el.firstElementChild;
		resizeObserver = contentWrapper && "ResizeObserver" in window ? new ResizeObserver(enforceSavedPosition) : null;
		if (contentWrapper) resizeObserver?.observe(contentWrapper);

		const onRestoreScroll = () => enforceSavedPosition();
		el.addEventListener("scroll", onRestoreScroll, { passive: true });
		el.scrollTop = savedPosition;
		armStopTimer();

		el.addEventListener("wheel", stopRestoring, { once: true, passive: true });
		el.addEventListener("touchstart", stopRestoring, { once: true, passive: true });
		el.addEventListener("pointerdown", stopRestoring, { once: true, passive: true });

		return () => {
			stopRestoring();
			el.removeEventListener("scroll", onRestoreScroll);
			el.removeEventListener("wheel", stopRestoring);
			el.removeEventListener("touchstart", stopRestoring);
			el.removeEventListener("pointerdown", stopRestoring);
		};
	}, [currentArticlePath, articleRef, getPosition, setProgrammaticScroll]);

	useEffect(() => {
		if (!articleRef?.current || !currentArticlePath) return;

		const saveScrollPosition = () => {
			if (isProgrammaticScrollRef.current) return;
			if (articleRef.current) setPosition(currentArticlePath, articleRef.current.scrollTop);
		};

		const scrollElement = articleRef.current;
		scrollElement.addEventListener("scroll", saveScrollPosition, { passive: true });

		return () => scrollElement.removeEventListener("scroll", saveScrollPosition);
	}, [currentArticlePath, articleRef, setPosition]);
};

export default useArticleScrollPosition;
