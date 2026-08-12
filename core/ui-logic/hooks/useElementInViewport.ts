import ViewportIntersectionService from "@core-ui/ContextServices/ViewportIntersection";
import { useScrollPositionStore } from "@core-ui/stores/ScrollPositionStore";
import { type RefObject, useCallback, useEffect, useMemo, useState } from "react";

interface UseElementInViewportOptions {
	/** Margin around the viewport used to grow the intersection box, e.g. "600px 0px" to preload before entry. */
	rootMargin?: string;
	/** When false, the element is treated as always visible (eager) — used to opt print/export out of lazy loading. */
	enabled?: boolean;
}

/**
 * Reports whether `ref` has entered (or come near) the viewport, using IntersectionObserver.
 *
 * Once visible the result latches to `true` and the observer disconnects — scrolling away never
 * flips it back, so a resource loaded once stays loaded. When disabled, or when IntersectionObserver
 * is unavailable (SSR / older runtime), it returns `true` immediately so behavior is unchanged.
 */
const useElementInViewport = (
	ref: RefObject<Element>,
	{ rootMargin = "0px", enabled = true }: UseElementInViewportOptions = {},
): boolean => {
	const viewportIntersectionService = ViewportIntersectionService.value;
	const isRestoringScrollPosition = useScrollPositionStore((state) => state.isRestoringScrollPosition);
	const canObserve = useMemo(
		() => enabled && !isRestoringScrollPosition && typeof IntersectionObserver !== "undefined",
		[enabled, isRestoringScrollPosition],
	);
	const [hasEnteredViewport, setHasEnteredViewport] = useState(false);
	const markAsEntered = useCallback(() => setHasEnteredViewport(true), []);

	useEffect(() => {
		if (!canObserve || hasEnteredViewport) return;
		const element = ref.current;
		if (!element) return;

		return viewportIntersectionService.observe(element, rootMargin, markAsEntered);
	}, [ref, rootMargin, canObserve, hasEnteredViewport, markAsEntered]);

	return !canObserve || hasEnteredViewport;
};

export default useElementInViewport;
