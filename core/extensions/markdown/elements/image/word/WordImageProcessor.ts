import Path from "@core/FileProvider/Path/Path";
import ResourceManager from "@core/Resource/ResourceManager";
import t from "@ext/localization/locale/translate";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";
import { GetImageByPathOptions } from "@ext/markdown/elements/image/export/NextImageProcessor";
import { MAX_WIDTH } from "@ext/wordExport/options/wordExportSettings";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { ImageRun } from "docx";
import resolveModule from "@app/resolveModule/backend";

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

		return this._getImageRun(imageBuffer, size);
	}

	static async getFileByPath(path: Path, resourceManager: ResourceManager) {
		const content = await resourceManager.getContent(path);
		if (!content) throw new Error(`${t("word.error.file-not-found-error")}: ${path.toString()}`);
		return content;
	}

	static async getImageFromSvgString(svgCode: string, maxWidth?: number) {
		const { imageBuffer, size } = await BaseImageProcessor.getImageFromSvgString(svgCode, maxWidth);
		return this._getImageRun(imageBuffer, size);
	}

	static async getImageFromDiagramString(svgCode: string, fitContent = false, maxWidth?: number) {
		const image = await BaseImageProcessor.getImageFromDom(svgCode, fitContent);
		return this._getImageRun(
			image,
			await ImageDimensionsFinder.getImageSizeFromImageData(Buffer.from(image), maxWidth ?? MAX_WIDTH),
		);
	}

	static async getImageFromSvgPath(path: Path, resourceManager: ResourceManager, maxWidth?: number) {
		const svgCode = (await resourceManager.getContent(path)).toString();
		return this.getImageFromSvgString(svgCode, maxWidth);
	}

	private static _getImageRun(imageBuffer: string | Buffer | Uint8Array | ArrayBuffer, size: ImageDimensions) {
		return new ImageRun({
			data: imageBuffer,
			transformation: {
				width: size.width,
				height: size.height,
			},
		});
	}
}
