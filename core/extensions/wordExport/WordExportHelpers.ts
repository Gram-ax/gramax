import { ImageRun } from "docx";
import { toBlob } from "html-to-image";
import Path from "../../logic/FileProvider/Path/Path";
import ResourceManager from "../../logic/Resource/ResourceManager";
import DefaultError from "@ext/errorHandlers/logic/DefaultError";

export interface ImageDimensions {
	width: number;
	height: number;
}

const FONT_EMBED_CSS = "";
const SCALE = 4;
const MAX_WIDTH = 595;
const MAX_HEIGHT = 842;

export class WordExportHelper {
	static async getFileByPath(path: Path, resourceManager: ResourceManager) {
		const content = await resourceManager.getContent(path);
		if (!content) throw new Error(`File not found at path: ${path.toString()}`);
		return content;
	}

	static async getImageSizeFromImageData(imageBuffer: Buffer | Blob, maxWidth = MAX_WIDTH, maxHeight = MAX_HEIGHT) {
		const img = new Image();
		const imageUrl = URL.createObjectURL(imageBuffer instanceof Blob ? imageBuffer : new Blob([imageBuffer]));
		img.src = imageUrl;

		const imageDimensions = await new Promise<ImageDimensions>((resolve, reject) => {
			img.onload = () => {
				if (img.width > maxWidth) resolve({ width: maxWidth, height: (maxWidth / img.width) * img.height });
				if (img.height > maxHeight) resolve({ height: maxHeight, width: (maxHeight / img.height) * img.width });
				else resolve({ width: img.width, height: img.height });
			};
			img.onerror = () => reject(new Error("Failed to load image"));
		});

		URL.revokeObjectURL(imageUrl);
		img.remove();

		return imageDimensions;
	}

	static async getImageByPath(path: Path, resourceManager: ResourceManager, maxWidth?: number, maxHeight?: number) {
		if (path.extension === "svg") return this.getImageFromSvgPath(path, resourceManager, maxWidth, maxHeight);

		const imageBuffer = await this.getFileByPath(path, resourceManager);
		const dimensions = await this.getImageSizeFromImageData(imageBuffer, maxWidth, maxHeight);

		return this._getImageRun(imageBuffer, dimensions);
	}

	static async getImageFromSvgPath(
		path: Path,
		resourceManager: ResourceManager,
		maxWidth?: number,
		maxHeight?: number,
	) {
		const svgCode = (await resourceManager.getContent(path)).toString();
		return this.getImageFromSvgString(svgCode, maxWidth, maxHeight);
	}

	static async getImageFromSvgString(svgCode: string, maxWidth?: number, maxHeight?: number) {
		const size = this.getSvgDimensions(svgCode);
		const image = await this.svgToPngBlob(svgCode, size);
		const dimensions = await this.getImageSizeFromImageData(image, maxWidth ?? size.width, maxHeight ?? size.width);

		return this._getImageRun(await image.arrayBuffer(), dimensions);
	}

	static getSvgDimensions(svgContent: string, maxWidth = MAX_WIDTH): { width: number; height: number } {
		const parser = new DOMParser();
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

	static async svgToPngBlob(svgContent: string, size: { width: number; height: number }): Promise<Blob | null> {
		const image = new Image();
		image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;

		const canvas = document.createElement("canvas");
		canvas.width = size.width * SCALE;
		canvas.height = size.height * SCALE;

		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Couldn't upload data for Canvas");

		await new Promise((resolve, reject) => {
			image.onload = resolve;
			image.onerror = () => reject(new DefaultError(`Failed to load image`));
		});

		ctx.drawImage(image, 0, 0, size.width * SCALE, size.height * SCALE);

		return new Promise((resolve) => {
			canvas.toBlob((blob) => resolve(blob));
		});
	}

	static async getImageFromDiagramString(svgCode: string, fitContent = false, maxWidth?: number, maxHeight?: number) {
		const image = await this.getImageFromDom(svgCode, fitContent);
		const dimensions = await this.getImageSizeFromImageData(image, maxWidth, maxHeight);

		return this._getImageRun(await image.arrayBuffer(), dimensions);
	}

	static async getImageFromDom(tag: string, fitContent = true) {
		const dom = document.createElement("div");
		dom.innerHTML = tag.trim();

		dom.className = "imageRenderer";
		if (fitContent) {
			dom.style.width = "fit-content";
			dom.style.height = "fit-content";
		}

		document.body.append(dom);
		const imageBlob = await toBlob(dom, { fontEmbedCSS: FONT_EMBED_CSS });
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
