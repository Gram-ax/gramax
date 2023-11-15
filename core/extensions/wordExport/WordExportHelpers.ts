import { ImageRun } from "docx";
import { toBlob } from "html-to-image";
import Path from "../../logic/FileProvider/Path/Path";
import FileProvider from "../../logic/FileProvider/model/FileProvider";
import ResourceManager from "../../logic/Resource/ResourceManager";

export interface ImageDimensions {
	width: number;
	height: number;
}

const fontEmbedCSS = "";

export class WordExportHelper {
	static async getFileByPath(
		path: Path,
		resourceManager: ResourceManager,
		fileProvider: FileProvider,
	): Promise<Buffer> {
		return await resourceManager.getContent(path, fileProvider);
	}

	static async getImageSizeFromImageData(
		imageBuffer: Buffer | Blob,
		maxWidth = 600,
		maxHeight = 600,
		defaultImageSize = 200,
	): Promise<ImageDimensions> {
		const img = new Image();
		const imageUrl = URL.createObjectURL(imageBuffer instanceof Blob ? imageBuffer : new Blob([imageBuffer]));
		img.src = imageUrl;

		const imageDimensions = await new Promise<ImageDimensions>((resolve) => {
			img.onload = () => {
				if (img.width > maxWidth) resolve({ width: maxWidth, height: (maxWidth / img.width) * img.height });
				if (img.height > maxHeight) resolve({ height: maxHeight, width: (maxHeight / img.height) * img.width });
				resolve({ width: img.width, height: img.height });
			};
			img.onerror = () => {
				resolve({ width: defaultImageSize, height: 200 });
			};
		});

		URL.revokeObjectURL(imageUrl);
		img.remove();

		return imageDimensions;
	}

	static async getImageByPath(
		path: Path,
		resourceManager: ResourceManager,
		fileProvider: FileProvider,
		maxWidth?: number,
		maxHeight?: number,
		defaultImageSize?: number,
	): Promise<ImageRun> {
		if (path.extension === "svg")
			return WordExportHelper.getImageFromSvgPath(
				path,
				resourceManager,
				fileProvider,
				maxWidth,
				maxHeight,
				defaultImageSize,
			);

		const imageBuffer = await resourceManager.getContent(path, fileProvider);

		const dimensions = await this.getImageSizeFromImageData(imageBuffer, maxWidth, maxHeight, defaultImageSize);

		return WordExportHelper._getImageRun(imageBuffer, dimensions);
	}

	static async getImageFromSvgPath(
		path: Path,
		resourceManager: ResourceManager,
		fileProvider: FileProvider,
		maxWidth?: number,
		maxHeight?: number,
		defaultImageSize?: number,
	): Promise<ImageRun> {
		const svgCode = (await resourceManager.getContent(path, fileProvider)).toString();
		return await WordExportHelper.getImageFromSvgString(svgCode, undefined, maxWidth, maxHeight, defaultImageSize);
	}

	static async getImageFromSvgString(
		svgCode: string,
		fitContent?: boolean,
		maxWidth?: number,
		maxHeight?: number,
		defaultImageSize?: number,
	) {
		const image = await this.getImageFromDom(svgCode, fitContent);
		const dimensions = await this.getImageSizeFromImageData(image, maxWidth, maxHeight, defaultImageSize);

		return WordExportHelper._getImageRun(await image.arrayBuffer(), dimensions);
	}

	static async getImageFromDom(tag: string, fitContent = true): Promise<Blob> {
		const dom = document.createElement("div");
		dom.innerHTML = tag.trim();

		dom.className = "imageRenderer";
		if (fitContent) {
			dom.style.width = "fit-content";
			dom.style.height = "fit-content";
		}

		document.body.append(dom);
		const imageBlob = await toBlob(dom, { fontEmbedCSS });
		dom.remove();

		return imageBlob;
	}

	private static _getImageRun(imageBuffer: string | Buffer | Uint8Array | ArrayBuffer, dimensions: ImageDimensions) {
		return new ImageRun({
			data: imageBuffer,
			transformation: {
				height: dimensions.height,
				width: dimensions.width,
			},
		});
	}
}
