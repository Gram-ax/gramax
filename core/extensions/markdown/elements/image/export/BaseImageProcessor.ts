import resolveModule from "@app/resolveModule/backend";
import type Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import t from "@ext/localization/locale/translate";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import type { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { SCALE } from "@ext/wordExport/options/wordExportSettings";

// biome-ignore lint/complexity/noStaticOnlyClass: provides shared protected helpers for environment-specific image processors
export class BaseImageProcessor {
	static async getFileByPath(path: Path, resourceManager: ResourceManager) {
		const content = await resourceManager.getContent(path);
		if (!content) throw new Error(`${t("word.error.file-not-found-error")}: ${path.toString()}`);
		return content;
	}

	static async getImageFromDom(tag: string, fitContent = true) {
		const getImageFromDom = resolveModule("getImageFromDom");
		return getImageFromDom(tag, fitContent);
	}

	static async getImageFromSvgPath(path: Path, resourceManager: ResourceManager, maxWidth?: number) {
		const svgCode = (await resourceManager.getContent(path)).toString();
		return BaseImageProcessor.getImageFromSvgString(svgCode, maxWidth);
	}

	static async getImageFromSvgString(svgCode: string, maxWidth?: number) {
		const size = ImageDimensionsFinder.getSvgDimensions(svgCode, maxWidth);
		const imageBuffer = await BaseImageProcessor.svgToPng(svgCode, size);
		return { imageBuffer, size };
	}

	static async svgToPng(svgCode: string, size: ImageDimensions): Promise<Buffer> {
		const svgToPng = resolveModule("svgToPng");
		return svgToPng(svgCode, size, SCALE);
	}

	protected static _calculateScaledDimension(value?: number, defaultValue?: number, scale?: number | string): number {
		const maxDimension = value ?? defaultValue;
		if (maxDimension === undefined || !Number.isFinite(maxDimension) || maxDimension <= 0) {
			throw new Error("Image maximum dimension must be a finite positive number");
		}
		if (!scale) return maxDimension;

		if (typeof scale === "string" && scale.endsWith("px")) {
			const pixelValue = parseFloat(scale);
			return Number.isFinite(pixelValue) && pixelValue > 0 ? Math.min(pixelValue, maxDimension) : maxDimension;
		}

		const percentage = typeof scale === "number" ? scale : Number(scale);
		return Number.isFinite(percentage) && percentage > 0 ? (maxDimension * percentage) / 100 : maxDimension;
	}

	protected static _scaleSize(size: ImageDimensions, targetWidth: number) {
		size.height = (size.height * targetWidth) / size.width;
		size.width = targetWidth;
	}
}
