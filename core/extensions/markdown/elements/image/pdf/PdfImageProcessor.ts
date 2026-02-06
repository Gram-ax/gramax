import resolveModule from "@app/resolveModule/backend";
import type Path from "@core/FileProvider/Path/Path";
import type ResourceManager from "@core/Resource/ResourceManager";
import type { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";
import type { GetImageByPathOptions } from "@ext/markdown/elements/image/export/NextImageProcessor";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import { MAX_WIDTH } from "@ext/pdfExport/config";

export class PDFImageExporter {
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

		const base64 = PDFImageExporter._bufferToBase64(imageBuffer);

		return { base64, size };
	}

	static async getImageFromDiagramString(svgCode: string, fitContent = false, maxWidth?: number) {
		const image = await BaseImageProcessor.getImageFromDom(svgCode, fitContent);
		const size = ImageDimensionsFinder.getSvgDimensions(svgCode, maxWidth);
		const base64 = PDFImageExporter._bufferToBase64(image);

		return { base64, size };
	}

	static async getImageFromSvgString(svgCode: string, maxWidth?: number) {
		const { imageBuffer, size } = await BaseImageProcessor.getImageFromSvgString(svgCode, maxWidth);
		const base64 = PDFImageExporter._bufferToBase64(imageBuffer);
		return { base64, size };
	}

	static async getImageFromSvgPath(path: Path, resourceManager: ResourceManager, maxWidth?: number) {
		const svgCode = (await resourceManager.getContent(path)).toString();
		return PDFImageExporter.getImageFromSvgString(svgCode, maxWidth);
	}

	protected static _bufferToBase64(buffer: Buffer, mimeType: string = "image/png"): string {
		return `data:${mimeType};base64,${buffer.toString("base64")}`;
	}
}
