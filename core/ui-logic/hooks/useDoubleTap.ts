import { useCallback, useRef } from "react";
import { TouchEvent as ReactTouchEvent, MouseEvent as ReactMouseEvent } from "react";

interface DoubleTapConfig {
	onDoubleTap: () => void;
	delay?: number;
	threshold?: number;
}

interface DoubleTapHandlers {
	onTouchStart: (event: ReactTouchEvent<HTMLElement>) => void;
	onDoubleClick: (event: ReactMouseEvent<HTMLElement>) => void;
}

export const useDoubleTap = (config: DoubleTapConfig): DoubleTapHandlers => {
	const { onDoubleTap, delay = 300, threshold = 50 } = config;

	const lastTapTimeRef = useRef<number>(0);
	const lastTapPositionRef = useRef<{ x: number; y: number }>(null);

	const onTouchStart = useCallback(
		(event: ReactTouchEvent<HTMLElement>) => {
			const currentTime = Date.now();
			const touch = event.touches[0];
			const currentPosition = { x: touch.clientX, y: touch.clientY };

			if (lastTapTimeRef.current && lastTapPositionRef.current) {
				const timeDiff = currentTime - lastTapTimeRef.current;
				const distance = Math.sqrt(
					Math.pow(currentPosition.x - lastTapPositionRef.current.x, 2) +
						Math.pow(currentPosition.y - lastTapPositionRef.current.y, 2),
				);

				if (timeDiff <= delay && distance <= threshold) {
					if (event.cancelable) event.preventDefault();

					onDoubleTap();
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
		},
		[onDoubleTap, delay, threshold],
	);

	const onDoubleClick = useCallback(
		(event: ReactMouseEvent<HTMLElement>) => {
			if (event.nativeEvent instanceof PointerEvent && event.nativeEvent.pointerType === "touch") return;

			onDoubleTap();
		},
		[onDoubleTap],
	);

	return {
		onTouchStart,
		onDoubleClick,
	};
};
