import { MAX_HEIGHT } from "@ext/wordExport/options/wordExportSettings";
import resolveModule from "@app/resolveModule/backend";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";

export class ImageDimensionsFinder {
	static getImageSizeFromImageData(imageBuffer: Buffer, maxWidth?: number, maxHeight?: number) {
		const getImageSizeFromImageData = resolveModule("getImageSizeFromImageData");
		return getImageSizeFromImageData(imageBuffer, maxWidth, maxHeight);
	}

	static getSvgDimensions(svgContent: string, maxWidth: number): ImageDimensions {
		const getDOMParser = resolveModule("getDOMParser");
		const parser = getDOMParser();
		const doc = parser.parseFromString(svgContent, "image/svg+xml");
		const svgElement = doc.documentElement;

		let widthAttr = svgElement.getAttribute("width");
		let heightAttr = svgElement.getAttribute("height");

		if (!widthAttr || !heightAttr) {
			const viewBoxAttr = svgElement.getAttribute("viewBox");
			if (viewBoxAttr) {
				const [, , width, height] = viewBoxAttr.split(" ").map(Number);
				widthAttr = width.toString();
				heightAttr = height.toString();
			}
		}

		let width = widthAttr ? parseFloat(widthAttr) : 0;
		let height = heightAttr ? parseFloat(heightAttr) : 0;

		if (width > maxWidth) {
			const ratio = maxWidth / width;
			width = maxWidth;
			height = height * ratio;
		}
		if (height > MAX_HEIGHT) {
			const ratio = MAX_HEIGHT / height;
			height = MAX_HEIGHT;
			width = width * ratio;
		}

		return {
			width,
			height,
		};
	}
}
