import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import getNearestNodeWithSameCommentId from "@ext/markdown/elements/comment/edit/logic/utils/getNearestNodeWithSameCommentId";
import type { ReviewListItem } from "@ext/review/models/ReviewList";
import type { Editor } from "@tiptap/core";

const getTargetScrollTop = (container: HTMLElement, el: HTMLElement) => {
	const cRect = container.getBoundingClientRect();
	const eRect = el.getBoundingClientRect();
	const eCenter = eRect.top + eRect.height / 2;
	const cCenter = cRect.top + cRect.height / 2;
	return Math.max(0, container.scrollTop + (eCenter - cCenter));
};

const STABLE_TIMEOUT = 150;
const STABLE_THRESHOLD = 1;

export const scrollToReviewItem = (container: HTMLElement, item: ReviewListItem, editor: Editor) => {
	const el = document.querySelector(item.selector) as HTMLElement;
	if (!el) return;

	let active = true;
	let isScrolling = false;
	let resizeObserver: ResizeObserver = null;
	let stabilizeTimeout: ReturnType<typeof setTimeout> = null;
	let scrollEndTimeout: ReturnType<typeof setTimeout> = null;
	let lastContentHeight = container.scrollHeight;

	const openComment = () => {
		const node = editor.view.posAtDOM(el, 0);
		if (!node) return;
		const range = getNearestNodeWithSameCommentId(editor.state, node, item.id);
		if (!range) return;
		editor.commands.openComment(item.id, range);
	};

	const cleanup = () => {
		if (!active) return;
		active = false;
		isScrolling = false;
		useScrollPositionStore.getState().setProgrammaticScroll(false);
		resizeObserver?.disconnect();
		if (stabilizeTimeout) clearTimeout(stabilizeTimeout);
		if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
		container.removeEventListener("wheel", cancel);
		container.removeEventListener("touchstart", cancel);
		container.removeEventListener("pointerdown", cancel);
		container.removeEventListener("scroll", onScroll);
	};

	const cancel = () => {
		cleanup();
	};

	const doScroll = () => {
		if (!active) return;
		const currentEl = document.querySelector(item.selector) as HTMLElement;
		if (!currentEl) return;

		const targetScrollTop = getTargetScrollTop(container, currentEl);

		if (Math.abs(container.scrollTop - targetScrollTop) < STABLE_THRESHOLD) {
			cleanup();
			openComment();
			return;
		}

		isScrolling = true;
		if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
		container.scrollTo({ top: targetScrollTop, behavior: "smooth" });
	};

	const onScroll = () => {
		if (!active) return;
		if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
		scrollEndTimeout = setTimeout(() => {
			if (!active) return;
			isScrolling = false;
			cleanup();
			openComment();
		}, 150);
	};

	const onResize = () => {
		if (!active || isScrolling) return;
		const newHeight = container.scrollHeight;
		if (Math.abs(newHeight - lastContentHeight) < STABLE_THRESHOLD) return;
		lastContentHeight = newHeight;

		// wait for content to stop changing before scrolling
		if (stabilizeTimeout) clearTimeout(stabilizeTimeout);
		stabilizeTimeout = setTimeout(doScroll, STABLE_TIMEOUT);
	};

	const contentWrapper = container.firstElementChild;
	resizeObserver = contentWrapper && "ResizeObserver" in window ? new ResizeObserver(onResize) : null;
	if (contentWrapper) resizeObserver?.observe(contentWrapper);

	container.addEventListener("scroll", onScroll, { passive: true });
	container.addEventListener("wheel", cancel, { once: true, passive: true });
	container.addEventListener("touchstart", cancel, { once: true, passive: true });
	container.addEventListener("pointerdown", cancel, { once: true, passive: true });

	useScrollPositionStore.getState().setProgrammaticScroll(true);

	// wait for initial content load before first scroll attempt
	stabilizeTimeout = setTimeout(doScroll, STABLE_TIMEOUT);
};
