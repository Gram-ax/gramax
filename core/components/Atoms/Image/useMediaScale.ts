import type { Rect } from "@components/Atoms/Image/modalImage/MediaRenderer";
import { useLayoutEffect } from "react";

interface UseMediaScaleProps {
	ref: React.RefObject<HTMLDivElement>;
	src: string;
	svg: string;
	onReady: (rect: Rect) => void;
}

export const useMediaScale = (props: UseMediaScaleProps) => {
	const { ref, src, svg, onReady } = props;

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected to be called only once
	useLayoutEffect(() => {
		const maxScale = () => {
			const container = ref.current;
			const view = container.firstElementChild as HTMLElement;
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;
			const maxViewWidth = windowWidth * 0.8;
			const maxViewHeight = windowHeight * 0.8;

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
	}, [src, svg]);
};
