import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import type { ChatMessage } from "../types/chat";

export const useScrollToBottom = (messages: ChatMessage[], isOpen: boolean) => {
	const scrollContainerRef = useRef<HTMLDivElement>(null);
	const innerContentRef = useRef<HTMLDivElement>(null);
	const prevLastUserIdRef = useRef<string | null>(null);
	const isUserScrolledUp = useRef(false);
	const isProgrammaticScroll = useRef(false);

	useEffect(() => {
		const root = scrollContainerRef.current;
		if (!root) return;

		const THRESHOLD = 100;

		const onScroll = () => {
			if (isProgrammaticScroll.current) return;
			const distanceFromBottom = root.scrollHeight - root.scrollTop - root.clientHeight;
			isUserScrolledUp.current = distanceFromBottom > THRESHOLD;
		};

		const onScrollEnd = () => {
			isProgrammaticScroll.current = false;
		};

		root.addEventListener("scroll", onScroll, { passive: true });
		root.addEventListener("scrollend", onScrollEnd, { passive: true });
		return () => {
			root.removeEventListener("scroll", onScroll);
			root.removeEventListener("scrollend", onScrollEnd);
		};
	}, []);

	useLayoutEffect(() => {
		if (!isOpen) return;
		const root = scrollContainerRef.current;
		if (root) root.scrollTop = root.scrollHeight;
		isUserScrolledUp.current = false;
	}, [isOpen]);

	const lastUserMessageId = useMemo(() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].kind === "user") return messages[i].id;
		}
		return null;
	}, [messages]);

	useLayoutEffect(() => {
		if (!lastUserMessageId) {
			prevLastUserIdRef.current = null;
			return;
		}

		const prev = prevLastUserIdRef.current;
		if (lastUserMessageId === prev) return;

		prevLastUserIdRef.current = lastUserMessageId;
		isUserScrolledUp.current = false;

		const isInitialLoad = prev === null;
		let scrollEndTimeoutId: ReturnType<typeof setTimeout> | null = null;
		const scrollToEnd = (behavior: ScrollBehavior = isInitialLoad ? "instant" : "smooth") => {
			const root = scrollContainerRef.current;
			if (!root) return;
			isProgrammaticScroll.current = true;
			root.scrollTo({ top: root.scrollHeight - root.clientHeight, behavior });
			if (scrollEndTimeoutId !== null) clearTimeout(scrollEndTimeoutId);
			scrollEndTimeoutId = setTimeout(
				() => {
					isProgrammaticScroll.current = false;
				},
				behavior === "instant" ? 0 : 100,
			);
		};

		scrollToEnd();
		let alive = true;

		const inner = innerContentRef.current;
		if (!inner) {
			return () => {
				alive = false;
				if (scrollEndTimeoutId !== null) clearTimeout(scrollEndTimeoutId);
			};
		}

		let rafId: number | null = null;
		const mo = new MutationObserver(() => {
			if (!alive || isUserScrolledUp.current) return;
			if (rafId !== null) return;
			rafId = requestAnimationFrame(() => {
				rafId = null;
				if (!alive || isUserScrolledUp.current) return;
				scrollToEnd("instant");
			});
		});
		mo.observe(inner, { childList: true, subtree: true, characterData: true });

		return () => {
			alive = false;
			if (rafId !== null) cancelAnimationFrame(rafId);
			if (scrollEndTimeoutId !== null) clearTimeout(scrollEndTimeoutId);
			mo.disconnect();
		};
	}, [lastUserMessageId]);

	return { scrollContainerRef, innerContentRef };
};
