import { resolveFileKind } from "@core-ui/utils/resolveFileKind";
import { Crop } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { MouseEventHandler } from "react";

const getPixels = (num: number, percent: number) => {
	return (num * percent) / 100;
};

export const calculateScale = (imageContainer: HTMLDivElement, imageSize: { w: number; h: number }, crop: Crop) => {
	const windowWidth = window.innerWidth;
	const windowHeight = window.innerHeight;

	const maxContainerWidth = windowWidth * 0.8;
	const maxContainerHeight = windowHeight * 0.8;

	const cropWidth = getPixels(imageSize.w, crop.w);
	const cropHeight = getPixels(imageSize.h, crop.h);

	const scaleX = maxContainerWidth / cropWidth;
	const scaleY = maxContainerHeight / cropHeight;

	return Math.min(scaleX, scaleY);
};

interface cropImageProps {
	image: HTMLImageElement;
	imageSize: { w: number; h: number };
	crop?: Crop;
	scale?: number;
}

export const getCroppedCanvas = async (
	imageContainer: HTMLDivElement,
	crop: Crop,
	realSrc: string,
	originalBuffer: Buffer,
): Promise<Blob> => {
	if (crop.x === 0 && crop.y === 0 && crop.w === 100 && crop.h === 100) return;

	const imageContainerRect = imageContainer?.getBoundingClientRect();
	if (!imageContainerRect) return;

	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");

	if (context) {
		const image = new Image();
		const buffer = originalBuffer || null;
		const type = resolveFileKind(buffer);
		image.src = buffer ? "data:" + type + ";base64," + buffer.toString("base64") : realSrc;

		return new Promise((resolve) => {
			image.onload = () => {
				const x = (crop.x / 100) * image.naturalWidth;
				const y = (crop.y / 100) * image.naturalHeight;
				const width = (crop.w / 100) * image.naturalWidth;
				const height = (crop.h / 100) * image.naturalHeight;

				canvas.width = width;
				canvas.height = height;

				context.drawImage(image, x, y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);

				canvas.toBlob((blob) => resolve(blob), resolveFileKind(buffer));
			};
		});
	}
	return;
};

export function cropImage(props: cropImageProps) {
	const { image, imageSize, crop = { x: 0, y: 0, w: 100, h: 100 }, scale = 1 } = props;
	if (crop.w === 0 || crop.h === 0 || (crop.w === 100 && crop.h === 100)) return;

	const cropX = getPixels(imageSize.w, crop.x);
	const cropY = getPixels(imageSize.h, crop.y);
	const cropW = getPixels(imageSize.w, crop.w);
	const cropH = getPixels(imageSize.h, crop.h);

	const parent = image.parentElement;
	parent.style.width = `${cropW * scale}px`;
	parent.style.height = `${cropH * scale}px`;

	image.style.maxWidth = "unset";
	image.style.maxHeight = "unset";

	image.style.left = -cropX * scale + "px";
	image.style.top = -cropY * scale + "px";

	image.style.transform = `scale(${scale})`;
	image.style.transformOrigin = "top left";
}

export const restoreImage = (image: HTMLImageElement, imageSize: { w: number; h: number }) => {
	if (!image) return;
	const parent = image.parentElement;

	parent.style.width = `${imageSize.w}px`;
	parent.style.height = `${imageSize.h}px`;

	image.style.left = "unset";
	image.style.top = "unset";
	image.style.transform = "unset";

	image.style.maxWidth = "100%";
	image.style.maxHeight = "100%";
};

interface HandleMoveProps {
	editable: boolean;
	parentRef: React.RefObject<HTMLDivElement>;
	mainRef: React.MutableRefObject<HTMLDivElement>;
	setDraggable: React.Dispatch<React.SetStateAction<boolean>>;
	setHover?: React.Dispatch<React.SetStateAction<boolean>>;
	onMouseUpCallback?: (newX: number, newY: number, newWidth?: number, newHeight?: number) => void;
	onMouseDownCallback?: () => boolean;
}

export const MINIMUM_SQUARE_SIZE = 20;

export const handleMove = (props: HandleMoveProps) => {
	const { setDraggable, setHover, editable, parentRef, mainRef, onMouseUpCallback, onMouseDownCallback } = props;

	const onMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
		if (!editable) return;
		setDraggable(true);

		if (setHover) setHover(false);
		if (onMouseDownCallback && !onMouseDownCallback()) return;

		event.preventDefault();

		const main = mainRef.current;
		const currentHandle = event.target as HTMLDivElement;
		const imageContainer = parentRef.current;
		const imageContainerRect = imageContainer.getBoundingClientRect();
		const cropperStyle = window.getComputedStyle(main);

		const computedStyle = getComputedStyle(main);
		const marginTop = parseFloat(computedStyle.marginTop);
		const marginLeft = parseFloat(computedStyle.marginLeft);

		main.style.marginTop = "0px";
		main.style.marginLeft = "0px";

		const startWidth = (parseFloat(cropperStyle.width) / imageContainerRect.width) * 100;
		const startHeight = (parseFloat(cropperStyle.height) / imageContainerRect.height) * 100;
		const startLeft = (parseFloat(cropperStyle.left) / imageContainerRect.width) * 100;
		const startTop = (parseFloat(cropperStyle.top) / imageContainerRect.height) * 100;

		main.style.left = `calc(${main.style.left} + ${marginLeft}px)`;
		main.style.top = `calc(${main.style.top} + ${marginTop}px)`;

		const startX = event.clientX;
		const startY = event.clientY;

		const applyConstraints = (value, min, max) => {
			return Math.min(Math.max(value, min), max);
		};

		const onMouseMove = (event: MouseEvent) => {
			const deltaX = event.clientX - startX;
			const deltaY = event.clientY - startY;

			let newWidth = (startWidth / 100) * imageContainerRect.width;
			let newHeight = (startHeight / 100) * imageContainerRect.height;
			let newTop = (startTop / 100) * imageContainerRect.height;
			let newLeft = (startLeft / 100) * imageContainerRect.width;

			switch (currentHandle.id) {
				case "top-left":
					newWidth = applyConstraints(newWidth - deltaX, MINIMUM_SQUARE_SIZE, newWidth + newLeft);
					newHeight = applyConstraints(newHeight - deltaY, MINIMUM_SQUARE_SIZE, newHeight + newTop);
					newLeft = newLeft + (newWidth - (newWidth - deltaX));
					newTop = newTop + (newHeight - (newHeight - deltaY));
					break;
				case "top-right":
					newWidth = applyConstraints(
						newWidth + deltaX,
						MINIMUM_SQUARE_SIZE,
						imageContainerRect.width - newLeft,
					);
					newHeight = applyConstraints(newHeight - deltaY, MINIMUM_SQUARE_SIZE, newHeight + newTop);
					newTop = newTop + (newHeight - (newHeight - deltaY));
					break;
				case "bottom-left":
					newWidth = applyConstraints(newWidth - deltaX, MINIMUM_SQUARE_SIZE, newWidth + newLeft);
					newHeight = applyConstraints(
						newHeight + deltaY,
						MINIMUM_SQUARE_SIZE,
						imageContainerRect.height - newTop,
					);
					newLeft = newLeft + (newWidth - (newWidth - deltaX));
					break;
				case "bottom-right":
					newWidth = applyConstraints(
						newWidth + deltaX,
						MINIMUM_SQUARE_SIZE,
						imageContainerRect.width - newLeft,
					);
					newHeight = applyConstraints(
						newHeight + deltaY,
						MINIMUM_SQUARE_SIZE,
						imageContainerRect.height - newTop,
					);
					break;
			}

			newLeft = applyConstraints(newLeft, 0, imageContainerRect.width - newWidth);
			newTop = applyConstraints(newTop, 0, imageContainerRect.height - newHeight);

			main.style.width = `${newWidth}px`;
			main.style.height = `${newHeight}px`;
			main.style.left = `${newLeft}px`;
			main.style.top = `${newTop}px`;
		};

		const onMouseUp = () => {
			setDraggable(false);
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			main.style.left = `calc(${main.style.left} - ${marginLeft}px)`;
			main.style.top = `calc(${main.style.top} - ${marginTop}px)`;

			const computedStyle = getComputedStyle(main);
			const leftPercent = (parseInt(computedStyle.left) / imageContainerRect.width) * 100;
			const topPercent = (parseInt(computedStyle.top) / imageContainerRect.height) * 100;
			const widthPercent = (parseInt(main.style.width) / imageContainerRect.width) * 100;
			const heightPercent = (parseInt(main.style.height) / imageContainerRect.height) * 100;

			main.style.marginTop = `${marginTop}px`;
			main.style.marginLeft = `${marginLeft}px`;

			if (onMouseUpCallback) onMouseUpCallback(leftPercent, topPercent, widthPercent, heightPercent);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	return onMouseDown;
};

interface ObjectMoveProps extends HandleMoveProps {
	isDraggable: boolean;
}

export const objectMove = (props: ObjectMoveProps) => {
	const { setDraggable, isDraggable, editable, parentRef, mainRef, onMouseUpCallback, onMouseDownCallback } = props;

	const cropperMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
		if (isDraggable || !editable) return;

		const object = mainRef.current;
		const computedStyle = getComputedStyle(object);
		const marginTop = parseFloat(computedStyle.marginTop);
		const marginLeft = parseFloat(computedStyle.marginLeft);

		object.style.marginTop = "0px";
		object.style.marginLeft = "0px";

		if (object !== event.target) return;

		if (onMouseDownCallback && !onMouseDownCallback()) return;
		setDraggable(true);

		object.style.left = `calc(${object.style.left} + ${marginLeft}px)`;
		object.style.top = `calc(${object.style.top} + ${marginTop}px)`;

		const offsetX = event.clientX - object.getBoundingClientRect().left;
		const offsetY = event.clientY - object.getBoundingClientRect().top;
		const containerRect = parentRef.current.getBoundingClientRect();

		const onMouseMove = (e: MouseEvent) => {
			const x = e.clientX - containerRect.left - offsetX;
			const y = e.clientY - containerRect.top - offsetY;

			const elementWidth = object.offsetWidth;
			const elementHeight = object.offsetHeight;

			const constrainedX = Math.min(Math.max(0, x), containerRect.width - elementWidth);
			const constrainedY = Math.min(Math.max(0, y), containerRect.height - elementHeight);

			object.style.left = `${constrainedX}px`;
			object.style.top = `${constrainedY}px`;
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			setDraggable(false);
			object.style.left = `calc(${object.style.left} - ${marginLeft}px)`;
			object.style.top = `calc(${object.style.top} - ${marginTop}px)`;

			const computedStyle = getComputedStyle(object);
			const leftPercent = (parseInt(computedStyle.left) / containerRect.width) * 100;
			const topPercent = (parseInt(computedStyle.top) / containerRect.height) * 100;
			const widthPercent = (parseInt(object.style.width) / containerRect.width) * 100;
			const heightPercent = (parseInt(object.style.height) / containerRect.height) * 100;

			object.style.marginTop = `${marginTop}px`;
			object.style.marginLeft = `${marginLeft}px`;

			if (onMouseUpCallback) onMouseUpCallback(leftPercent, topPercent, widthPercent, heightPercent);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	return cropperMouseDown;
};
