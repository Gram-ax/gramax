import IsEditService from "@core-ui/ContextServices/IsEdit";
import { DRAG_SCROLL_THRESHOLD } from "@ext/markdown/elements/article/edit/DragScroller";
import { useEffect, useRef } from "react";
import { useDragDropManager } from "react-dnd";

const throttle = (func: (...args: any[]) => void, timeFrame: number) => {
	let lastTime = 0;
	return (...args: any[]) => {
		const now = Date.now();
		if (now - lastTime >= timeFrame) {
			func(...args);
			lastTime = now;
		}
	};
};

const intBetween = (min: number, max: number, val: number) => Math.floor(Math.min(max, Math.max(min, val)));

export type Point = {
	x: number;
	y: number;
};

export type Size = {
	x: number;
	y: number;
	w: number;
	h: number;
};

const verticalStrength = ({ y, h, x, w }: Size, point: Point): number => {
	const buffer = h * DRAG_SCROLL_THRESHOLD;
	const adjustedBuffer = Math.min(h / 2, buffer);
	const inRange = point.y >= y && point.y <= y + h;
	const inBox = inRange && point.x >= x && point.x <= x + w;

	if (inBox) {
		if (point.y < y + adjustedBuffer) {
			return (point.y - y - adjustedBuffer) / adjustedBuffer;
		}
		if (point.y > y + h - adjustedBuffer) {
			return -(y + h - point.y - adjustedBuffer) / adjustedBuffer;
		}
	}

	return 0;
};

const useScrolling = (containerRef: React.MutableRefObject<HTMLDivElement | null>, strengthMultiplier = 30) => {
	const isEdit = IsEditService.value;
	const animationFrameID = useRef<number>(0);
	const scaleY = useRef<number>(0);
	const isDragging = useRef<boolean>(false);
	const dragDropManager = useDragDropManager();

	const startScrolling = () => {
		const container = containerRef.current;
		if (!container) return;

		const tick = () => {
			if (strengthMultiplier === 0 || scaleY.current === 0) {
				stopScrolling();
				return;
			}

			const { scrollTop, scrollHeight, clientHeight } = container;
			container.scrollTop = intBetween(
				0,
				scrollHeight - clientHeight,
				scrollTop + scaleY.current * strengthMultiplier,
			);

			animationFrameID.current = requestAnimationFrame(tick);
		};

		tick();
	};

	const stopScrolling = () => {
		cancelAnimationFrame(animationFrameID.current);
		animationFrameID.current = 0;
		scaleY.current = 0;
	};

	const updateScrolling = throttle((evt: MouseEvent | DragEvent) => {
		const container = containerRef.current;
		if (!container) return;

		const { left: x, top: y, width: w, height: h } = container.getBoundingClientRect();
		const box: Size = { x, y, w, h };
		const coords = { x: evt.clientX, y: evt.clientY };

		scaleY.current = verticalStrength(box, coords);

		if (!animationFrameID.current && scaleY.current !== 0) {
			startScrolling();
		}
	}, 100);

	const handleDragOver = (evt: DragEvent) => {
		if (isDragging.current) {
			updateScrolling(evt);
		}
	};

	useEffect(() => {
		if (!isEdit) return;
		const container = containerRef.current;
		if (!container) return;

		const monitor = dragDropManager.getMonitor();

		const unsubscribe = monitor.subscribeToStateChange(() => {
			const currentDragging = monitor.isDragging();
			if (!isDragging.current && currentDragging) {
				isDragging.current = true;
			} else if (isDragging.current && !currentDragging) {
				isDragging.current = false;
				stopScrolling();
			}
		});

		container.addEventListener("dragover", handleDragOver);
		return () => {
			container.removeEventListener("dragover", handleDragOver);
			unsubscribe();
			stopScrolling();
		};
	}, [dragDropManager, isEdit]);
};

export default useScrolling;
