import styled from "@emotion/styled";
import getScale from "@ext/markdown/elements/image/render/logic/getScale";
import { MutableRefObject, ReactElement, useCallback, useEffect, useState } from "react";

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
	const [isResizing, setIsResizing] = useState<boolean>(false);

	const onMouseDown = useCallback(
		(event) => {
			if (isResizing) return;

			const object = imageRef.current;
			const mainContainer = containerRef.current;
			const nodeViewWrapper = mainContainer.closest("[data-drag-handle]");
			nodeViewWrapper.removeAttribute("data-drag-handle");

			setIsResizing(true);
			const initialWidth = object.offsetWidth;
			const initialX = event.clientX;
			const initialHeight = object.offsetHeight;
			const maxWidth = parseFloat(getComputedStyle(containerRef.current).width);
			const minWidth = 2.5 * parseFloat(getComputedStyle(object).fontSize);

			const onMouseMove = (e: MouseEvent) => {
				const deltaX = e.clientX - initialX;
				const newWidth = initialWidth + deltaX;
				const aspectRatio = initialWidth / initialHeight;
				const newHeight = newWidth / aspectRatio;

				if (newWidth >= maxWidth) {
					object.style.width = `${maxWidth}px`;
				} else if (newHeight <= minWidth || newWidth <= minWidth) {
					const adjustedWidth = minWidth * aspectRatio;
					object.style.width = `${adjustedWidth}px`;
				} else {
					object.style.width = `${newWidth}px`;
				}
			};

			const onMouseUp = () => {
				document.removeEventListener("mousemove", onMouseMove);
				document.removeEventListener("mouseup", onMouseUp);
				setIsResizing(false);
				nodeViewWrapper.setAttribute("data-drag-handle", "true");

				const containerWidth = parseFloat(getComputedStyle(containerRef.current).width);
				const finalWidth = object.offsetWidth;
				const widthPercent = Math.round((finalWidth / containerWidth) * 100);
				saveResize(widthPercent);
			};

			document.addEventListener("mousemove", onMouseMove);
			document.addEventListener("mouseup", onMouseUp);
		},
		[saveResize],
	);

	useEffect(() => {
		const applyScale = (newScale: number = 100) => {
			const image = imageRef.current;
			if (image && newScale === null) {
				image.style.removeProperty("width");
				return;
			}

			const scale = newScale || 100;
			if (!image || +image.style.width || !scale) return;

			const width = getScale(scale, parseFloat(getComputedStyle(containerRef.current).width));
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
			<div className="resizer" onMouseDownCapture={onMouseDown} />
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
