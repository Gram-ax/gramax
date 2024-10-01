import styled from "@emotion/styled";
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
			const container = object.parentElement;
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
					container.style.width = `${maxWidth}px`;
					object.style.width = `${maxWidth}px`;
				} else if (newHeight <= minWidth || newWidth <= minWidth) {
					const adjustedWidth = minWidth * aspectRatio;
					container.style.width = `${adjustedWidth}px`;
					object.style.width = `${adjustedWidth}px`;
				} else {
					container.style.width = `${newWidth}px`;
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

	const applyScale = useCallback((scale: number) => {
		const image = imageRef.current;
		if (!image || +image.style.width || !scale) return;

		const width = (scale / 100) * parseFloat(getComputedStyle(containerRef.current).width);
		image.style.width = `${width}px`;
		image.parentElement.style.width = `${width}px`;
	}, []);

	useEffect(() => {
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
	right: -1em;
	top: 0;
	width: 1em;
	height: 100%;
	display: flex;
	align-items: center;
	padding: 6px;
	max-height: 100%;

	.resizer {
		cursor: col-resize;
		width: 100%;
		height: 50%;
		background-color: var(--color-focus);
		border-radius: var(--radius-large);
	}
`;
