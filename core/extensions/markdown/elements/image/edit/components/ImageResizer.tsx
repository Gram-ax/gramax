import { useTouchHandler } from "@core-ui/hooks/useTouchHandler";
import styled from "@emotion/styled";
import getScale from "@ext/markdown/elements/image/render/logic/getScale";
import { MutableRefObject, ReactElement, useCallback, useEffect } from "react";

interface ImageResizerProps {
	saveResize: (resize: number) => void;
	imageRef: MutableRefObject<HTMLImageElement>;
	containerRef: MutableRefObject<HTMLDivElement>;
	selected?: boolean;
	scale?: number;
	className?: string;
}

const ImageResizer = (props: ImageResizerProps): ReactElement => {
	const { containerRef, className, imageRef, saveResize, scale, selected = false } = props;

	const getContainer = useCallback(() => {
		const container = containerRef.current.closest("[data-resize-container]");
		if (!container) return containerRef.current;
		return container.parentElement;
	}, []);

	const handleResizeStart = useCallback(() => {
		const mainContainer = containerRef.current;
		const nodeViewWrapper = mainContainer.closest("[data-drag-handle]");
		if (nodeViewWrapper) {
			nodeViewWrapper.removeAttribute("data-drag-handle");
		}
	}, [containerRef]);

	const handleResizeMove = useCallback(
		(deltaX: number) => {
			const object = imageRef.current;
			const container = getContainer();

			if (!object || !container) return;

			const currentWidth = object.offsetWidth;
			const currentHeight = object.offsetHeight;

			const newWidth = currentWidth + deltaX;
			const aspectRatio = currentWidth / currentHeight;
			const newHeight = newWidth / aspectRatio;

			const maxWidth = parseFloat(getComputedStyle(container).width);
			const minWidth = 2.5 * parseFloat(getComputedStyle(object).fontSize);

			if (newWidth >= maxWidth) {
				object.style.width = `${maxWidth}px`;
			} else if (newHeight <= minWidth || newWidth <= minWidth) {
				const adjustedWidth = minWidth * aspectRatio;
				object.style.width = `${adjustedWidth}px`;
			} else {
				object.style.width = `${newWidth}px`;
			}
		},
		[imageRef, containerRef],
	);

	const handleResizeEnd = useCallback(() => {
		const mainContainer = containerRef.current;
		const nodeViewWrapper = mainContainer.closest("[data-drag-handle]");
		if (nodeViewWrapper) {
			nodeViewWrapper.setAttribute("data-drag-handle", "true");
		}

		const object = imageRef.current;

		if (!object) return;

		const containerWidth = parseFloat(getComputedStyle(getContainer()).width);
		const finalWidth = object.offsetWidth;
		const widthPercent = Math.round((finalWidth / containerWidth) * 100);
		saveResize(widthPercent);
	}, [containerRef, imageRef, saveResize]);

	const { onPointerDown, onTouchStart, onMouseDown } = useTouchHandler({
		onStart: handleResizeStart,
		onMove: (deltaX) => handleResizeMove(deltaX),
		onEnd: handleResizeEnd,
	});

	useEffect(() => {
		const applyScale = (newScale: number = 100) => {
			const image = imageRef.current;
			if (image && !newScale) {
				image.style.removeProperty("width");
				return;
			}

			const scale = newScale || 100;
			if (!image || +image.style.width || !scale) return;

			const container = getContainer();
			if (!container) return;

			const width = getScale(scale, parseFloat(getComputedStyle(container).width));
			image.style.width = `${width}px`;
		};

		applyScale(scale);

		const resize = () => {
			applyScale(scale);
		};

		window.addEventListener("resize", resize);

		return () => {
			window.removeEventListener("resize", resize);
		};
	}, [scale, containerRef?.current]);

	if (!selected) return <></>;
	return (
		<div className={className}>
			<div
				className="resizer"
				onMouseDown={onMouseDown}
				onPointerDown={onPointerDown}
				onTouchStart={onTouchStart}
			/>
		</div>
	);
};

export default styled(ImageResizer)`
	position: absolute;
	right: -2px;
	top: 0;
	width: 6px;
	height: 100%;
	display: flex;
	align-items: center;
	max-height: 100%;

	.resizer {
		opacity: 0;
		cursor: col-resize;
		width: 100%;
		height: max(25%, 1.5em);
		border: 2px solid var(--color-focus);
		background-color: var(--color-white);
		border-radius: var(--radius-large);
		transition: opacity 0.15s ease-in-out;
		touch-action: none;
		user-select: none;

		.resizer-container:hover & {
			opacity: 1;
			transition-delay: 0s;
		}

		.resizer-container:not(:hover) & {
			opacity: 0;
			transition-delay: 0.3s;
		}
	}
`;
