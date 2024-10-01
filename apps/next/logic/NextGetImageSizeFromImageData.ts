import { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import sharp from "sharp";

const getImageSizeFromImageData = async (
	imageBuffer: Buffer,
	maxWidth?: number,
	maxHeight?: number,
): Promise<ImageDimensions> => {
	const image = sharp(imageBuffer);
	let { width, height } = await image.metadata();

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

	return { width: width || 0, height: height || 0 };
};

export default getImageSizeFromImageData;
