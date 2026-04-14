import type { Rect } from "@components/Atoms/Image/modalImage/MediaRenderer";
import { type Breakpoint, useBreakpoint } from "@core-ui/hooks/useBreakpoint";
import { useLayoutEffect } from "react";

interface UseMediaScaleProps {
	ref: React.RefObject<HTMLDivElement>;
	src: string;
	svg: string;
	onReady: (rect: Rect) => void;
}

const resolveMaxSizeByBreakpoint = (breakpoint: Breakpoint) => {
	switch (breakpoint) {
		case "sm":
			return { width: 1, height: 1 };
		case "md":
			return { width: 0.8, height: 0.8 };
		case "lg":
			return { width: 0.8, height: 0.8 };
		case "xl":
			return { width: 0.8, height: 0.8 };
		case "2xl":
			return { width: 0.8, height: 0.8 };
	}
};

export const useMediaScale = (props: UseMediaScaleProps) => {
	const { ref, src, svg, onReady } = props;
	const breakpoint = useBreakpoint();

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected to be called only once
	useLayoutEffect(() => {
		const { width, height } = resolveMaxSizeByBreakpoint(breakpoint);

		const maxScale = () => {
			const container = ref.current;
			if (!container) return;

			const view = container.firstElementChild as HTMLElement;
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;
			const maxViewWidth = windowWidth * width;
			const maxViewHeight = windowHeight * height;

			const viewRect = view.getBoundingClientRect();

			const scaleWidth = maxViewWidth / viewRect.width;
			const scaleHeight = maxViewHeight / viewRect.height;
			const newScale = Math.min(scaleWidth, scaleHeight);

			container.style.scale = `${newScale}`;
			container.setAttribute("data-scale", `${newScale}`);

			onReady({
				left: parseFloat(container.style.left) || 0,
				top: parseFloat(container.style.top) || 0,
				scale: parseFloat(container.style.scale),
			});
		};

		const element = document.createElement(svg ? "div" : "img");
		element.style.position = "absolute";
		element.style.top = "0";
		element.style.left = "0";
		element.style.width = "100vw";
		element.style.height = "100vh";

		if (src) {
			(element as HTMLImageElement).src = src;
			element.onload = () => {
				maxScale();
				element.remove();
			};
		} else {
			(element as HTMLDivElement).innerHTML = svg;
			maxScale();
		}

		element.remove();
	}, [src, svg, breakpoint]);
};
