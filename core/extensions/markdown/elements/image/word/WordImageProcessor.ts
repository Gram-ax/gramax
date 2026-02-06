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
import { MAX_WIDTH } from "@ext/wordExport/options/wordExportSettings";

export class WordImageExporter {
	static async getImageByPath(
		path: Path,
		resourceManager: ResourceManager,
		maxWidth?: number,
		maxHeight?: number,
		crop?: Crop,
		objects?: ImageObject[],
		scale?: number,
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
		return new ImageRun({
			data: imageBuffer,
			transformation: {
				width: size.width,
				height: size.height,
			},
		});
	}
}
