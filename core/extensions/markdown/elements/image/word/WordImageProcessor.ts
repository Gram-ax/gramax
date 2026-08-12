import resolveModule from "@app/resolveModule/backend";
import type Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import docx from "@dynamicImports/docx";
import t from "@ext/localization/locale/translate";
import type { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";
import type { GetImageByPathOptions } from "@ext/markdown/elements/image/export/NextImageProcessor";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import type { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { MAX_HEIGHT, MAX_WIDTH } from "@ext/wordExport/options/wordExportSettings";

// biome-ignore lint/complexity/noStaticOnlyClass: preserves the existing namespace-style image export API
export class WordImageExporter {
	static async getImageByPath(
		path: Path,
		resourceManager: ResourceManager,
		maxWidth?: number,
		maxHeight?: number,
		crop?: Crop,
		objects?: ImageObject[],
		scale?: number | string,
	) {
		const options: GetImageByPathOptions = {
			path,
			resourceManager,
			defaultValue: MAX_WIDTH,
			maxWidth,
			maxHeight,
			crop,
			objects,
			scale,
		};
		const { imageBuffer, size } = await resolveModule("getImageByPath")(options);

		return WordImageExporter._getImageRun(imageBuffer, size);
	}

	static async getFileByPath(path: Path, resourceManager: ResourceManager) {
		const content = await resourceManager.getContent(path);
		if (!content) throw new Error(`${t("word.error.file-not-found-error")}: ${path.toString()}`);
		return content;
	}

	static async getImageFromSvgString(svgCode: string, maxWidth?: number) {
		const { imageBuffer, size } = await BaseImageProcessor.getImageFromSvgString(svgCode, maxWidth);
		return WordImageExporter._getImageRun(imageBuffer, size);
	}

	static async getImageFromDiagramString(svgCode: string, fitContent = false, maxWidth?: number) {
		const image = await BaseImageProcessor.getImageFromDom(svgCode, fitContent);
		return WordImageExporter._getImageRun(
			image,
			await ImageDimensionsFinder.getImageSizeFromImageData(
				Buffer.from(image as unknown as ArrayBuffer),
				maxWidth ?? MAX_WIDTH,
			),
		);
	}

	static async getImageFromSvgPath(path: Path, resourceManager: ResourceManager, maxWidth?: number) {
		const svgCode = (await resourceManager.getContent(path)).toString();
		return WordImageExporter.getImageFromSvgString(svgCode, maxWidth);
	}

	private static async _getImageRun(imageBuffer: string | Buffer | Uint8Array | ArrayBuffer, size: ImageDimensions) {
		const { ImageRun } = await docx();
		const safeSize = await WordImageExporter._getSafeImageSize(imageBuffer, size);
		return new ImageRun({
			data: imageBuffer,
			transformation: {
				width: safeSize.width,
				height: safeSize.height,
			},
		});
	}

	private static async _getSafeImageSize(
		imageBuffer: string | Buffer | Uint8Array | ArrayBuffer,
		size: ImageDimensions,
	): Promise<ImageDimensions> {
		if (WordImageExporter._isValidImageSize(size)) return size;

		const buffer = WordImageExporter._toBuffer(imageBuffer);
		const fallbackSize = await ImageDimensionsFinder.getImageSizeFromImageData(buffer, MAX_WIDTH, MAX_HEIGHT);
		if (!WordImageExporter._isValidImageSize(fallbackSize)) {
			throw new Error("Unable to calculate valid image dimensions for Word export");
		}

		return fallbackSize;
	}

	private static _isValidImageSize(size: ImageDimensions): boolean {
		return Number.isFinite(size.width) && size.width > 0 && Number.isFinite(size.height) && size.height > 0;
	}

	private static _toBuffer(imageBuffer: string | Buffer | Uint8Array | ArrayBuffer): Buffer {
		if (typeof imageBuffer === "string") {
			const dataUri = imageBuffer.match(/^data:[^;]+;base64,(.+)$/s);
			return Buffer.from(dataUri?.[1] ?? imageBuffer, dataUri ? "base64" : undefined);
		}
		if (imageBuffer instanceof ArrayBuffer) return Buffer.from(new Uint8Array(imageBuffer));

		return Buffer.from(imageBuffer);
	}
}
