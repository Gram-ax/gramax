import { type MouseEvent as ReactMouseEvent, type RefObject, useCallback, useEffect, useRef } from "react";

interface DoubleTapConfig {
	onDoubleTap: () => void;
	elementRef: RefObject<HTMLElement>;
	delay?: number;
	threshold?: number;
}

interface DoubleTapHandlers {
	onDoubleClick: (event: ReactMouseEvent<HTMLElement>) => void;
}

export const useDoubleTap = (config: DoubleTapConfig): DoubleTapHandlers => {
	const { onDoubleTap, elementRef, delay = 300, threshold = 50 } = config;

	const lastTapTimeRef = useRef<number>(0);
	const lastTapPositionRef = useRef<{ x: number; y: number }>(null);
	const onDoubleTapRef = useRef(onDoubleTap);
	onDoubleTapRef.current = onDoubleTap;

	useEffect(() => {
		const element = elementRef.current;
		if (!element) return;

		const handleTouchStart = (event: TouchEvent) => {
			const currentTime = Date.now();
			const touch = event.touches[0];
			const currentPosition = { x: touch.clientX, y: touch.clientY };

			if (lastTapTimeRef.current && lastTapPositionRef.current) {
				const timeDiff = currentTime - lastTapTimeRef.current;
				const distance = Math.sqrt(
					(currentPosition.x - lastTapPositionRef.current.x) ** 2 +
						(currentPosition.y - lastTapPositionRef.current.y) ** 2,
				);

				if (timeDiff <= delay && distance <= threshold) {
					if (event.cancelable) event.preventDefault();

					onDoubleTapRef.current();
					lastTapTimeRef.current = 0;
					lastTapPositionRef.current = null;
					return;
				}
			}

			lastTapTimeRef.current = currentTime;
			lastTapPositionRef.current = currentPosition;

			setTimeout(() => {
				if (lastTapTimeRef.current === currentTime) {
					lastTapTimeRef.current = 0;
					lastTapPositionRef.current = null;
				}
			}, delay);
		};

		element.addEventListener("touchstart", handleTouchStart, { passive: false });
		return () => element.removeEventListener("touchstart", handleTouchStart);
	}, [elementRef, delay, threshold]);

	const onDoubleClick = useCallback(
		(event: ReactMouseEvent<HTMLElement>) => {
			if (event.nativeEvent instanceof PointerEvent && event.nativeEvent.pointerType === "touch") return;

			onDoubleTap();
		},
		[onDoubleTap],
	);

	return {
		onDoubleClick,
	};
};
