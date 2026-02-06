import resolveModule from "@app/resolveModule/backend";
import type Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import t from "@ext/localization/locale/translate";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import type { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { SCALE } from "@ext/wordExport/options/wordExportSettings";

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

	protected static _calculateScaledDimension(value?: number, defaultValue?: number, scale?: number): number {
		if (!scale) return value ?? defaultValue;
		return value ? (value * scale) / 100 : (defaultValue * scale) / 100;
	}

	protected static _scaleSize(size: ImageDimensions, targetWidth: number) {
		size.height = (size.height * targetWidth) / size.width;
		size.width = targetWidth;
	}
}
