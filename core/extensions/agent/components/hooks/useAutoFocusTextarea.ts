import { useAgentChatIsOpen } from "@ext/agent/components/store/AgentChatIsOpenStore";
import useChatStore from "@ext/agent/components/store/ChatStore";
import { useLayoutEffect, useRef } from "react";

const FOCUS_DEADLINE_MS = 3000;
const STEAL_GUARD_MS = 250;
const FOCUS_RETRY_DELAYS_MS = [0, 16, 50, 100, 250, 500, 1000];

export const useAutoFocusTextarea = (disabled?: boolean) => {
	const activeSessionId = useChatStore((s) => s.activeSessionId);
	const isOpen = useAgentChatIsOpen();
	const containerRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		const container = containerRef.current;
		if (!activeSessionId || !isOpen || disabled || !container) return;

		let stopped = false;
		let rafId: number | null = null;
		let guardCleanup: (() => void) | null = null;
		let focusedTextarea: HTMLTextAreaElement | null = null;
		const timeoutIds: ReturnType<typeof setTimeout>[] = [];

		const focusTextarea = () => {
			if (stopped) return;
			if (hasOpenFloatingLayer()) return;

			const textarea = container.querySelector<HTMLTextAreaElement>("textarea");
			if (!textarea) return;

			if (isUserEditingAnotherField(document.activeElement, textarea, focusedTextarea)) return;

			textarea.focus({ preventScroll: true });
			rafId = requestAnimationFrame(() => {
				if (stopped) return;
				if (document.activeElement === textarea) {
					if (focusedTextarea !== textarea) {
						guardCleanup?.();
						focusedTextarea = textarea;
						guardCleanup = installStealGuard(textarea);
					}
					return;
				}
				focusTextarea();
			});
		};

		const scheduleFocus = () => {
			for (const delay of FOCUS_RETRY_DELAYS_MS) {
				const timeoutId = setTimeout(() => {
					rafId = requestAnimationFrame(focusTextarea);
				}, delay);
				timeoutIds.push(timeoutId);
			}
		};

		const observer = new MutationObserver(() => {
			const textarea = container.querySelector<HTMLTextAreaElement>("textarea");
			if (!textarea || textarea === focusedTextarea) return;
			focusTextarea();
		});
		observer.observe(container, { childList: true, subtree: true });
		scheduleFocus();

		const deadline = setTimeout(() => {
			stopped = true;
			observer.disconnect();
		}, FOCUS_DEADLINE_MS);

		return () => {
			stopped = true;
			observer.disconnect();
			if (rafId !== null) cancelAnimationFrame(rafId);
			for (const timeoutId of timeoutIds) clearTimeout(timeoutId);
			clearTimeout(deadline);
			guardCleanup?.();
		};
	}, [activeSessionId, disabled, isOpen]);

	return containerRef;
};

function hasOpenFloatingLayer(): boolean {
	const layers = document.querySelectorAll<HTMLElement>(
		'[role="menu"], [role="listbox"], [data-radix-popper-content-wrapper]',
	);

	return Array.from(layers).some((layer) => layer.isConnected && layer.getClientRects().length > 0);
}

function isUserEditingAnotherField(
	activeElement: Element | null,
	textarea: HTMLTextAreaElement,
	focusedTextarea: HTMLTextAreaElement | null,
): boolean {
	if (
		!activeElement ||
		activeElement === document.body ||
		activeElement === textarea ||
		activeElement === focusedTextarea
	) {
		return false;
	}

	const tagName = activeElement.tagName.toLowerCase();
	return (
		tagName === "input" ||
		tagName === "textarea" ||
		tagName === "select" ||
		(activeElement as HTMLElement).isContentEditable
	);
}

// After focus is confirmed, guard against it being stolen within STEAL_GUARD_MS.
// Only re-focuses when relatedTarget is null (focus moved to body, not user click).
function installStealGuard(textarea: HTMLTextAreaElement): () => void {
	const onFocusOut = (e: FocusEvent) => {
		if (e.relatedTarget) return;
		requestAnimationFrame(() => {
			if (!textarea.isConnected) return;
			textarea.focus({ preventScroll: true });
		});
	};
	textarea.addEventListener("focusout", onFocusOut);
	const timerId = setTimeout(() => textarea.removeEventListener("focusout", onFocusOut), STEAL_GUARD_MS);
	return () => {
		clearTimeout(timerId);
		textarea.removeEventListener("focusout", onFocusOut);
	};
}
