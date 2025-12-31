import { useEffect, useRef } from "react";

const DEFAULT_CHART_WIDTH = 800;
const RESIZE_DEBOUNCE_MS = 150;
const RESIZE_THRESHOLD = 50;

interface UseChartResizeOptions {
	containerRef: React.RefObject<HTMLElement>;
	onResize: () => void;
}

export const useChartResize = ({ containerRef, onResize }: UseChartResizeOptions) => {
	const containerWidthRef = useRef<number>(DEFAULT_CHART_WIDTH);
	const resizeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (!containerRef.current) return;

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;

			const newWidth = entry.contentRect.width;

			if (Math.abs(newWidth - containerWidthRef.current) < RESIZE_THRESHOLD) return;

			containerWidthRef.current = newWidth;

			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}

			resizeTimeoutRef.current = setTimeout(() => {
				onResize();
			}, RESIZE_DEBOUNCE_MS);
		});

		resizeObserver.observe(containerRef.current);

		return () => {
			resizeObserver.disconnect();
			if (resizeTimeoutRef.current) {
				clearTimeout(resizeTimeoutRef.current);
			}
		};
	}, [containerRef, onResize]);

	return { containerWidthRef };
};
