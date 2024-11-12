import React, { RefObject, useEffect, useRef, useState } from "react";
import { Crop, Cropper } from "../../model/imageEditorTypes";
import styled from "@emotion/styled";
import { handleMove, objectMove } from "@ext/markdown/elements/image/edit/logic/imageEditorMethods";

const ImageCropper = (props: Cropper & { className?: string; parentRef: RefObject<HTMLDivElement> }) => {
	const { crop, cropEnabled, setCrop, handleUpdateArea, className, parentRef } = props;
	const cropperRef = useRef<HTMLDivElement>(null);
	const [isDraggable, setDraggable] = useState<boolean>(false);
	const [curCrop, setCurCrop] = useState<Crop>(null);

	const cropperMouseDown = objectMove({
		isDraggable,
		parentRef,
		setDraggable,
		mainRef: cropperRef,
		onMouseUpCallback: function (): void {
			const cropper = cropperRef.current;
			const rect = {
				x: parseFloat(cropper.style.left),
				y: parseFloat(cropper.style.top),
				w: parseFloat(cropper.style.width),
				h: parseFloat(cropper.style.height),
			};

			setCrop(rect);
			handleUpdateArea(rect);
		},
	});

	useEffect(() => {
		if (!crop) return;
		setCurCrop(crop);
	}, [cropEnabled]);

	const onMouseDown = handleMove({
		setDraggable,
		parentRef,
		mainRef: cropperRef,
		onMouseUpCallback: function (): void {
			const cropper = cropperRef.current;

			const rect = {
				x: parseFloat(cropper.style.left),
				y: parseFloat(cropper.style.top),
				w: parseFloat(cropper.style.width),
				h: parseFloat(cropper.style.height),
			};

			setCrop(rect);
			handleUpdateArea(rect);
		},
	});

	if (!cropEnabled) return null;
	return (
		<div
			ref={cropperRef}
			style={{
				left: curCrop.x + "%",
				top: curCrop.y + "%",
				width: curCrop.w + "%",
				height: curCrop.h + "%",
			}}
			onMouseDown={cropperMouseDown}
			className={className}
		>
			<div onMouseDown={onMouseDown} id="top-left" className="handle top-left" />
			<div onMouseDown={onMouseDown} id="top-right" className="handle top-right" />
			<div onMouseDown={onMouseDown} id="bottom-right" className="handle bottom-right" />
			<div onMouseDown={onMouseDown} id="bottom-left" className="handle bottom-left" />

			<div className="cropper__overlay"></div>
		</div>
	);
};

export default styled(ImageCropper)`
	position: absolute;
	top: 0px;
	left: 0px;
	width: 100%;
	height: 100%;
	z-index: var(--z-index-base);
	padding: 8px;
	outline: 2px solid #808080;
	cursor: grab;
	:active {
		cursor: grabbing;
	}

	.cropper__overlay {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		box-shadow: 2px 2px 0 2000px var(--color-modal-overlay-style-bg);
		pointer-events: none;
	}

	.handle {
		position: absolute;
		width: 30px;
		height: 30px;
		border: 2px solid #1476ff;
		user-select: none;
		z-index: var(--z-index-base);
	}

	.top-left {
		left: -2px;
		top: -2px;
		cursor: nwse-resize;
		border-right: none;
		border-bottom: none;
		border-bottom-right-radius: 9999px;
	}

	.top-right {
		right: -2px;
		top: -2px;
		cursor: nesw-resize;
		border-left: none;
		border-bottom: none;
		border-bottom-left-radius: 9999px;
	}

	.bottom-left {
		left: -2px;
		bottom: -2px;
		border-top: none;
		border-right: none;
		cursor: nesw-resize;
		border-top-right-radius: 9999px;
	}

	.bottom-right {
		right: -2px;
		bottom: -2px;
		border-left: none;
		border-top: none;
		cursor: nwse-resize;
		border-top-left-radius: 9999px;
	}
`;
