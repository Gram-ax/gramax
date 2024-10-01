import t from "@ext/localization/locale/translate";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";

const svgToPngBlob = async (svg: string, size: ImageDimensions, scale: number): Promise<Blob | null> => {
	const image = new Image();
	image.src = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;

	const canvas = document.createElement("canvas");
	canvas.width = size.width * scale;
	canvas.height = size.height * scale;

	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error(t("word.error.canvas-error"));

	await new Promise((resolve, reject) => {
		image.onload = resolve;
		image.onerror = () => reject(new Error(t("word.error.load-image-error")));
	});

	ctx.drawImage(image, 0, 0, size.width * scale, size.height * scale);

	return new Promise((resolve) => {
		canvas.toBlob((blob) => resolve(blob));
	});
};

const svgToPng = async (svg: string, size: ImageDimensions, scale: number): Promise<Buffer> => {
	const blob = await svgToPngBlob(svg, size, scale);
	if (!blob) throw new Error(t("word.error.load-image-error"));

	const arrayBuffer = await blob.arrayBuffer();
	return Buffer.from(arrayBuffer);
};

export default svgToPng;
