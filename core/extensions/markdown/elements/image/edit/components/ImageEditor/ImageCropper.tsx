import React, { RefObject, useRef, useState } from "react";
import { Cropper } from "../../model/imageEditorTypes";
import styled from "@emotion/styled";

const MINIMUM_SIZE = 100;

const ImageCropper = ({
	cropEnabled,
	setCrop,
	className,
	parentRef,
}: Cropper & { className?: string; parentRef: RefObject<HTMLDivElement> }) => {
	const cropperRef = useRef<HTMLDivElement>(null);
	const [isDrag, setDrag] = useState<boolean>(false);

	const cropperMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
		if (isDrag) return;

		const cropper = cropperRef.current;

		if (cropper !== event.target) return;

		const offsetX = event.clientX - cropper.getBoundingClientRect().left;
		const offsetY = event.clientY - cropper.getBoundingClientRect().top;
		const containerRect = parentRef.current.getBoundingClientRect();

		const onMouseMove = (e: MouseEvent) => {
			const x = e.clientX - containerRect.left - offsetX;
			const y = e.clientY - containerRect.top - offsetY;

			const elementWidthPercent = (cropper.offsetWidth / containerRect.width) * 100;
			const elementHeightPercent = (cropper.offsetHeight / containerRect.height) * 100;

			const xPercent = Math.min(Math.max(0, (x / containerRect.width) * 100), 100 - elementWidthPercent);
			const yPercent = Math.min(Math.max(0, (y / containerRect.height) * 100), 100 - elementHeightPercent);

			cropper.style.left = `${xPercent}%`;
			cropper.style.top = `${yPercent}%`;
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			const rect = {
				x: parseFloat(cropper.style.left),
				y: parseFloat(cropper.style.top),
				w: parseFloat(cropper.style.width),
				h: parseFloat(cropper.style.height),
			};

			setCrop(rect);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	const handleDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
		setDrag(true);
		event.preventDefault();

		const cropper = cropperRef.current;
		const currentHandle = event.target as HTMLDivElement;
		const imageContainer = parentRef.current;
		const imageContainerRect = imageContainer.getBoundingClientRect();
		const cropperStyle = window.getComputedStyle(cropper);

		const startWidth = (parseFloat(cropperStyle.width) / imageContainerRect.width) * 100;
		const startHeight = (parseFloat(cropperStyle.height) / imageContainerRect.height) * 100;
		const startLeft = (parseFloat(cropperStyle.left) / imageContainerRect.width) * 100;
		const startTop = (parseFloat(cropperStyle.top) / imageContainerRect.height) * 100;

		const startX = event.clientX;
		const startY = event.clientY;

		const applyConstraints = (value, min, max) => {
			return Math.min(Math.max(value, min), max);
		};

		const onMouseMove = (event: MouseEvent) => {
			const deltaX = ((event.clientX - startX) / imageContainerRect.width) * 100;
			const deltaY = ((event.clientY - startY) / imageContainerRect.height) * 100;

			let newWidth = startWidth;
			let newHeight = startHeight;
			let newTop = startTop;
			let newLeft = startLeft;

			const minimumWidthPercent = (MINIMUM_SIZE / imageContainerRect.width) * 100;
			const minimumHeightPercent = (MINIMUM_SIZE / imageContainerRect.height) * 100;

			switch (currentHandle.id) {
				case "top-left":
					newWidth = applyConstraints(startWidth - deltaX, minimumWidthPercent, startWidth + startLeft);
					newHeight = applyConstraints(startHeight - deltaY, minimumHeightPercent, startHeight + startTop);
					newLeft = startLeft + (startWidth - newWidth);
					newTop = startTop + (startHeight - newHeight);
					break;
				case "top-right":
					newWidth = applyConstraints(startWidth + deltaX, minimumWidthPercent, 100 - startLeft);
					newHeight = applyConstraints(startHeight - deltaY, minimumHeightPercent, startHeight + startTop);
					newTop = startTop + (startHeight - newHeight);
					break;
				case "bottom-left":
					newWidth = applyConstraints(startWidth - deltaX, minimumWidthPercent, startWidth + startLeft);
					newHeight = applyConstraints(startHeight + deltaY, minimumHeightPercent, 100 - startTop);
					newLeft = startLeft + (startWidth - newWidth);
					break;
				case "bottom-right":
					newWidth = applyConstraints(startWidth + deltaX, minimumWidthPercent, 100 - startLeft);
					newHeight = applyConstraints(startHeight + deltaY, minimumHeightPercent, 100 - startTop);
					break;
			}

			newLeft = applyConstraints(newLeft, 0, 100 - newWidth);
			newTop = applyConstraints(newTop, 0, 100 - newHeight);

			cropper.style.width = `${newWidth}%`;
			cropper.style.height = `${newHeight}%`;
			cropper.style.left = `${newLeft}%`;
			cropper.style.top = `${newTop}%`;
		};

		const onMouseUp = () => {
			setDrag(false);
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			const rect = {
				x: parseFloat(cropper.style.left),
				y: parseFloat(cropper.style.top),
				w: parseFloat(cropper.style.width),
				h: parseFloat(cropper.style.height),
			};

			setCrop(rect);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	if (!cropEnabled) return null;
	return (
		<div ref={cropperRef} onMouseDown={cropperMouseDown} className={className}>
			<div onMouseDown={handleDown} id="top-left" className="handle top-left" />
			<div onMouseDown={handleDown} id="top-right" className="handle top-right" />
			<div onMouseDown={handleDown} id="bottom-right" className="handle bottom-right" />
			<div onMouseDown={handleDown} id="bottom-left" className="handle bottom-left" />

			<div className="cropper__overlay"></div>
		</div>
	);
};

export default styled(ImageCropper)`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 100;
	border: 2px solid #1476ff;
	cursor: move;

	.handle {
		position: absolute;
		width: 15px;
		height: 15px;
		border: 1px solid #000;
		background-color: #fff;
		user-select: none;
	}

	.top-left {
		left: 0;
		top: 0;
		cursor: nwse-resize;
		border-bottom-right-radius: 9999px;
	}

	.top-right {
		right: 0;
		top: 0;
		cursor: nesw-resize;
		border-bottom-left-radius: 9999px;
	}

	.bottom-left {
		left: 0;
		bottom: 0;
		cursor: nesw-resize;
		border-top-right-radius: 9999px;
	}

	.bottom-right {
		right: 0;
		bottom: 0;
		cursor: nwse-resize;
		border-top-left-radius: 9999px;
	}

	.cropper__overlay {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 100;
		box-shadow: 2px 2px 0 2000px var(--color-modal-overlay-style-bg);
		pointer-events: none;
	}
`;
