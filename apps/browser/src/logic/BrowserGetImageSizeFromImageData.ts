import t from "@ext/localization/locale/translate";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";

const getImageSizeFromImageData = async (
	imageBuffer: Buffer,
	maxWidth?: number,
	maxHeight?: number,
): Promise<ImageDimensions> => {
	const img = new Image();
	const imageUrl = URL.createObjectURL(imageBuffer instanceof Blob ? imageBuffer : new Blob([imageBuffer]));
	img.src = imageUrl;

	const imageDimensions = await new Promise<ImageDimensions>((resolve, reject) => {
		img.onload = () => {
			let width = img.width;
			let height = img.height;

			if (width > maxWidth) {
				const ratio = maxWidth / width;
				width = maxWidth;
				height = height * ratio;
			}
			if (height > maxHeight) {
				const ratio = maxHeight / height;
				height = maxHeight;
				width = width * ratio;
			}
			resolve({ width, height });
		};
		img.onerror = () => reject(new Error(t("word.error.load-image-error")));
	});

	URL.revokeObjectURL(imageUrl);
	img.remove();

	return imageDimensions;
};

export default getImageSizeFromImageData;
