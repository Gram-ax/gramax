import { useCallback, useRef } from "react";
import { PointerEvent as ReactPointerEvent, TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent } from "react";

interface TouchHandlerConfig {
	onStart?: (clientX: number, clientY: number) => void;
	onMove: (deltaX: number, deltaY: number, clientX: number, clientY: number) => void;
	onEnd?: () => void;
	preventDefault?: boolean;
	stopPropagation?: boolean;
	capturePointer?: boolean;
}

const isInteractiveElement = (element: Element): boolean => {
	const tagName = element.tagName.toLowerCase();
	const interactiveTags = ["a", "button", "input", "textarea", "select", "label"];

	if (interactiveTags.includes(tagName)) return true;
	const role = element.getAttribute("role");

	if (role && ["button", "link", "textbox", "combobox"].includes(role)) return true;
	return false;
};

const shouldIgnoreEvent = (target: Element): boolean => {
	if (isInteractiveElement(target) || isInteractiveElement(target.parentElement)) return true;
	return false;
};

interface TouchHandlers {
	onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
	onTouchStart: (event: ReactTouchEvent<HTMLElement>) => void;
	onMouseDown: (event: ReactMouseEvent<HTMLElement>) => void;
	isTouching: boolean;
}

export const useTouchHandler = (config: TouchHandlerConfig): TouchHandlers => {
	const { onStart, onMove, onEnd, preventDefault = true, stopPropagation = true, capturePointer = true } = config;

	const isTouchingRef = useRef(false);
	const initialPositionRef = useRef<{ x: number; y: number }>(null);
	const capturedElementRef = useRef<HTMLElement>(null);
	const capturedPointerIdRef = useRef<number>(null);

	const startTouch = useCallback(
		(clientX: number, clientY: number, element?: HTMLElement, pointerId?: number) => {
			if (isTouchingRef.current) return;

			isTouchingRef.current = true;
			initialPositionRef.current = { x: clientX, y: clientY };
			capturedElementRef.current = element || null;
			capturedPointerIdRef.current = pointerId ?? null;

			onStart?.(clientX, clientY);

			let lastX = clientX;
			let lastY = clientY;

			const handleMove = (moveClientX: number, moveClientY: number) => {
				const deltaX = moveClientX - lastX;
				const deltaY = moveClientY - lastY;

				lastX = moveClientX;
				lastY = moveClientY;

				onMove(deltaX, deltaY, moveClientX, moveClientY);
			};

			const finishDrag = () => {
				document.removeEventListener("pointermove", onPointerMove);
				document.removeEventListener("pointerup", onPointerUp);
				document.removeEventListener("touchmove", onTouchMove);
				document.removeEventListener("touchend", onTouchEnd);
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);

				if (capturedPointerIdRef.current !== null && capturedElementRef.current) {
					try {
						capturedElementRef.current.releasePointerCapture(capturedPointerIdRef.current);
					} catch (e) {}
				}

				isTouchingRef.current = false;
				initialPositionRef.current = null;
				capturedElementRef.current = null;
				capturedPointerIdRef.current = null;

				onEnd?.();
			};

			const onPointerMove = (e: PointerEvent) => {
				if (preventDefault && e.cancelable) e.preventDefault();

				handleMove(e.clientX, e.clientY);
			};

			const onPointerUp = (e: PointerEvent) => {
				if (preventDefault && e.cancelable) e.preventDefault();

				finishDrag();
			};

			const onTouchMove = (e: TouchEvent) => {
				if (preventDefault && e.cancelable) e.preventDefault();

				if (e.touches.length === 1) {
					handleMove(e.touches[0].clientX, e.touches[0].clientY);
				} else if (e.touches.length === 2) {
					const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
					const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
					handleMove(centerX, centerY);
				}
			};

			const onTouchEnd = (e: TouchEvent) => {
				if (preventDefault && e.cancelable) e.preventDefault();

				finishDrag();
			};

			const onMouseMove = (e: MouseEvent) => {
				if (preventDefault && e.cancelable) e.preventDefault();

				handleMove(e.clientX, e.clientY);
			};

			const onMouseUp = (e: MouseEvent) => {
				if (preventDefault && e.cancelable) e.preventDefault();

				finishDrag();
			};

			document.addEventListener("pointermove", onPointerMove, { passive: false });
			document.addEventListener("pointerup", onPointerUp, { passive: false });
			document.addEventListener("touchmove", onTouchMove, { passive: false });
			document.addEventListener("touchend", onTouchEnd, { passive: false });
			document.addEventListener("mousemove", onMouseMove, { passive: false });
			document.addEventListener("mouseup", onMouseUp, { passive: false });

			if (capturePointer && pointerId !== undefined && element) {
				try {
					element.setPointerCapture(pointerId);
				} catch (e) {}
			}
		},
		[onStart, onMove, onEnd, preventDefault, capturePointer],
	);

	const onPointerDown = useCallback(
		(event: ReactPointerEvent<HTMLElement>) => {
			if (shouldIgnoreEvent(event.target as Element)) return;
			if (preventDefault && event.cancelable) event.preventDefault();
			if (stopPropagation) event.stopPropagation();

			startTouch(event.clientX, event.clientY, event.currentTarget, event.pointerId);
		},
		[startTouch, preventDefault, stopPropagation],
	);

	const onTouchStart = useCallback(
		(event: ReactTouchEvent<HTMLElement>) => {
			if (shouldIgnoreEvent(event.target as Element)) return;
			if (preventDefault && event.cancelable) event.preventDefault();
			if (stopPropagation) event.stopPropagation();

			if (event.touches.length === 1) {
				startTouch(event.touches[0].clientX, event.touches[0].clientY, event.currentTarget);
			} else if (event.touches.length === 2) {
				const centerX = (event.touches[0].clientX + event.touches[1].clientX) / 2;
				const centerY = (event.touches[0].clientY + event.touches[1].clientY) / 2;
				startTouch(centerX, centerY, event.currentTarget);
			}
		},
		[startTouch, preventDefault, stopPropagation],
	);

	const onMouseDown = useCallback(
		(event: ReactMouseEvent<HTMLElement>) => {
			if (shouldIgnoreEvent(event.target as Element)) return;
			if (event.nativeEvent instanceof PointerEvent) return;

			if (preventDefault && event.cancelable) event.preventDefault();
			if (stopPropagation) event.stopPropagation();

			startTouch(event.clientX, event.clientY, event.currentTarget);
		},
		[startTouch, preventDefault, stopPropagation],
	);

	return {
		onPointerDown,
		onTouchStart,
		onMouseDown,
		isTouching: isTouchingRef.current,
	};
};
