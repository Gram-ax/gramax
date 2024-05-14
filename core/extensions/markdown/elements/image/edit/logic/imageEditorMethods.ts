// Обрезка изображения и применение стилей на родительский контейнер изображения,
import { Crop } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";

// иначе после обрезки оно будет неверно отображаться
export function cropImage(imgElement: HTMLImageElement, imageContainer: HTMLDivElement, src: string, crop: Crop) {
	const cropX = crop?.x ?? 0;
	const cropY = crop?.y ?? 0;
	const cropW = crop?.w ?? 100;
	const cropH = crop?.h ?? 100;

	if (cropW === 0 || cropH === 0) return;

	const imageContainerRect = imageContainer.getBoundingClientRect();

	const x = (cropX / 100) * imageContainerRect.width;
	const y = (cropY / 100) * imageContainerRect.height;
	const width = (cropW / 100) * imageContainerRect.width;
	const height = (cropH / 100) * imageContainerRect.height;

	if (width === 0 || height === 0) return;

	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");

	if (context) {
		const image = new Image();
		image.src = src;

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

			if (imgElement) {
				imgElement.src = canvas.toDataURL("image/png");
			}
		};
	}
}

export const restoreImage = (imageContainer: HTMLDivElement, imgElement: HTMLImageElement, src: string) => {
	if (!imageContainer || !imgElement) return;

	imgElement.src = src;

	imageContainer.style.width = "auto";
	imageContainer.style.height = "auto";
};
