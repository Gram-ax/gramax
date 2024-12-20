import { resolveImageKind } from "@components/Atoms/Image/resolveImageKind";
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

	const x = (crop.x / 100) * imageContainerRect.width;
	const y = (crop.y / 100) * imageContainerRect.height;
	const width = (crop.w / 100) * imageContainerRect.width;
	const height = (crop.h / 100) * imageContainerRect.height;

	if (width === 0 || height === 0) return;

	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");

	if (context) {
		const image = new Image();
		const buffer = originalBuffer || null;
		image.src = buffer ? "data:" + resolveImageKind(buffer) + ";base64," + buffer.toString("base64") : realSrc;

		return new Promise((resolve) => {
			image.onload = () => {
				const scaleX = image.naturalWidth / imageContainerRect.width;
				const scaleY = image.naturalHeight / imageContainerRect.height;

				canvas.width = width * scaleX;
				canvas.height = height * scaleY;

				context.drawImage(
					image,
					x * scaleX,
					y * scaleY,
					canvas.width,
					canvas.height,
					0,
					0,
					canvas.width,
					canvas.height,
				);

				canvas.toBlob((blob) => resolve(blob), "image/png");
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
	setDraggable: React.Dispatch<React.SetStateAction<boolean>>;
	parentRef: React.RefObject<HTMLDivElement>;
	mainRef: React.MutableRefObject<HTMLDivElement>;
	setHover?: React.Dispatch<React.SetStateAction<boolean>>;
	onMouseUpCallback?: (newX: number, newY: number, newWidth?: number, newHeight?: number) => void;
	onMouseDownCallback?: () => boolean;
}

export const MINIMUM_SQUARE_SIZE = 40;

export const handleMove = (props: HandleMoveProps) => {
	const { setDraggable, setHover, parentRef, mainRef, onMouseUpCallback, onMouseDownCallback } = props;

	const onMouseDown: MouseEventHandler<HTMLDivElement> = (event) => {
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
			const deltaX = ((event.clientX - startX) / imageContainerRect.width) * 100;
			const deltaY = ((event.clientY - startY) / imageContainerRect.height) * 100;

			let newWidth = startWidth;
			let newHeight = startHeight;
			let newTop = startTop;
			let newLeft = startLeft;

			const minimumWidthPercent = (MINIMUM_SQUARE_SIZE / imageContainerRect.width) * 100;
			const minimumHeightPercent = (MINIMUM_SQUARE_SIZE / imageContainerRect.height) * 100;

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

			main.style.width = `${newWidth}%`;
			main.style.height = `${newHeight}%`;
			main.style.left = `${newLeft}%`;
			main.style.top = `${newTop}%`;
		};

		const onMouseUp = () => {
			setDraggable(false);
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);

			main.style.left = `calc(${main.style.left} - ${marginLeft}px)`;
			main.style.top = `calc(${main.style.top} - ${marginTop}px)`;

			const computedStyle = getComputedStyle(main);
			const leftPercent = +((parseInt(computedStyle.left) / imageContainerRect.width) * 100).toFixed(2);
			const topPercent = +((parseInt(computedStyle.top) / imageContainerRect.height) * 100).toFixed(2);
			const widthPercent = +parseInt(main.style.width).toFixed(2);
			const heightPercent = +parseInt(main.style.height).toFixed(2);

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
	const { setDraggable, isDraggable, parentRef, mainRef, onMouseUpCallback, onMouseDownCallback } = props;

	const cropperMouseDown: React.MouseEventHandler<HTMLDivElement> = (event) => {
		if (isDraggable) return;

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

			const elementWidthPercent = (object.offsetWidth / containerRect.width) * 100;
			const elementHeightPercent = (object.offsetHeight / containerRect.height) * 100;

			const xPercent = Math.min(Math.max(0, (x / containerRect.width) * 100), 100 - elementWidthPercent);
			const yPercent = Math.min(Math.max(0, (y / containerRect.height) * 100), 100 - elementHeightPercent);

			object.style.left = `${xPercent}%`;
			object.style.top = `${yPercent}%`;
		};

		const onMouseUp = () => {
			document.removeEventListener("mousemove", onMouseMove);
			document.removeEventListener("mouseup", onMouseUp);
			setDraggable(false);
			object.style.left = `calc(${object.style.left} - ${marginLeft}px)`;
			object.style.top = `calc(${object.style.top} - ${marginTop}px)`;

			const computedStyle = getComputedStyle(object);
			const leftPercent = +((parseInt(computedStyle.left) / containerRect.width) * 100).toFixed(2);
			const topPercent = +((parseInt(computedStyle.top) / containerRect.height) * 100).toFixed(2);
			const widthPercent = +parseInt(object.style.width).toFixed(2);
			const heightPercent = +parseInt(object.style.height).toFixed(2);

			object.style.marginTop = `${marginTop}px`;
			object.style.marginLeft = `${marginLeft}px`;

			if (onMouseUpCallback) onMouseUpCallback(leftPercent, topPercent, widthPercent, heightPercent);
		};

		document.addEventListener("mousemove", onMouseMove);
		document.addEventListener("mouseup", onMouseUp);
	};

	return cropperMouseDown;
};
