import { ImageRun } from "docx";
import { toBlob } from "html-to-image";
import Path from "../../logic/FileProvider/Path/Path";
import ResourceManager from "../../logic/Resource/ResourceManager";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import t from "@ext/localization/locale/translate";
import Square from "@ext/markdown/elements/image/word/imageEditor/Square";
import Annotation from "@ext/markdown/elements/image/word/imageEditor/Annotation";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";

const FONT_EMBED_CSS = "";
const SCALE = 4;
const MAX_WIDTH = 595;
const MAX_HEIGHT = 842;

export class WordExportHelper {
	static async getFileByPath(path: Path, resourceManager: ResourceManager) {
		const content = await resourceManager.getContent(path);
		if (!content) throw new Error(`${t("word.error.file-not-found-error")}: ${path.toString()}`);
		return content;
	}

	static async getImageSizeFromImageData(imageBuffer: Buffer | Blob, maxWidth?: number, maxHeight?: number) {
		const img = new Image();
		const imageUrl = URL.createObjectURL(imageBuffer instanceof Blob ? imageBuffer : new Blob([imageBuffer]));
		img.src = imageUrl;

		const imageDimensions = await new Promise<ImageDimensions>((resolve, reject) => {
			img.onload = () => {
				if (maxWidth && img.width > maxWidth) {
					const height = (maxWidth / img.width) * img.height;

					if (maxHeight && height > maxHeight)
						resolve({ height: maxHeight, width: (maxHeight / img.height) * img.width });
					else resolve({ width: maxWidth, height: (maxWidth / img.width) * img.height });
				} else if (maxHeight && img.height > maxHeight)
					resolve({ height: maxHeight, width: (maxHeight / img.height) * img.width });
				else resolve({ width: img.width, height: img.height });
			};
			img.onerror = () => reject(new Error(t("word.error.load-image-error")));
		});

		URL.revokeObjectURL(imageUrl);
		img.remove();

		return imageDimensions;
	}

	static async getImageByPath(
		path: Path,
		resourceManager: ResourceManager,
		maxWidth?: number,
		maxHeight?: number,
		crop?: Crop,
		objects?: ImageObject[],
	) {
		if (path.extension === "svg") return this.getImageFromSvgPath(path, resourceManager);

		let imageBuffer = await this.getFileByPath(path, resourceManager);
		let size = await this.getImageSizeFromImageData(imageBuffer);
		let image = await this._createImageFromBuffer(imageBuffer);

		if (crop) {
			imageBuffer = Buffer.from(await this._cropImageToBuffer(image, crop, size));
			size = await this.getImageSizeFromImageData(imageBuffer);
			image = await this._createImageFromBuffer(imageBuffer);
		}

		if (objects?.length > 0) {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) throw new Error(t("word.error.canvas-error"));

			canvas.width = size.width;
			canvas.height = size.height;

			ctx.drawImage(image, 0, 0, size.width, size.height);

			objects.forEach((object, index) => {
				if (object.type === "square")
					new Square(MAX_WIDTH, size.width).draw(
						ctx,
						object,
						(index + 1).toString(),
						size,
						objects.length > 1,
					);
				else if (object.type === "annotation")
					new Annotation(MAX_WIDTH, size.width).draw(
						ctx,
						object,
						(index + 1).toString(),
						size,
						objects.length > 1,
					);
			});

			imageBuffer = Buffer.from(
				await new Promise<Uint8Array>((resolve, reject) => {
					canvas.toBlob((blob) => {
						if (!blob) reject(new Error(t("word.error.canvas-to-blob-error")));
						const reader = new FileReader();
						reader.onloadend = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
						reader.readAsArrayBuffer(blob);
					}, "image/png");
				}),
			);

			image = await this._createImageFromBuffer(imageBuffer);
		}

		return this._getImageRun(
			imageBuffer,
			await this.getImageSizeFromImageData(imageBuffer, maxWidth ?? MAX_WIDTH, maxHeight ?? MAX_HEIGHT),
		);
	}

	private static _createImageFromBuffer(buffer: Buffer): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = (err) => reject(err);
			image.src = URL.createObjectURL(new Blob([buffer]));
		});
	}

	private static async _cropImageToBuffer(
		image: HTMLImageElement,
		crop: Crop,
		size: ImageDimensions,
	): Promise<Uint8Array> {
		const canvas = document.createElement("canvas");
		const ctx = canvas.getContext("2d");

		if (!ctx) throw new Error(t("word.error.canvas-error"));

		const cropX = (size.width * crop.x) / 100;
		const cropY = (size.height * crop.y) / 100;
		const cropW = (size.width * crop.w) / 100;
		const cropH = (size.height * crop.h) / 100;

		canvas.width = cropW;
		canvas.height = cropH;

		ctx.drawImage(image, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

		return new Promise<Uint8Array>((resolve, reject) => {
			canvas.toBlob((blob) => {
				if (!blob) reject(new Error(t("word.error.canvas-to-blob-error")));
				const reader = new FileReader();
				reader.onloadend = () => resolve(new Uint8Array(reader.result as ArrayBuffer));
				reader.readAsArrayBuffer(blob);
			}, "image/png");
		});
	}

	static async getImageFromSvgPath(path: Path, resourceManager: ResourceManager, maxWidth?: number) {
		const svgCode = (await resourceManager.getContent(path)).toString();
		return this.getImageFromSvgString(svgCode, maxWidth);
	}

	static async getImageFromSvgString(svgCode: string, maxWidth?: number) {
		const size = this.getSvgDimensions(svgCode, maxWidth);
		const image = await this.svgToPngBlob(svgCode, size);

		return this._getImageRun(await image.arrayBuffer(), size);
	}

	static getSvgDimensions(svgContent: string, maxWidth = MAX_WIDTH): ImageDimensions {
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

	static async svgToPngBlob(svgContent: string, size: ImageDimensions): Promise<Blob | null> {
		const image = new Image();
		image.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;

		const canvas = document.createElement("canvas");
		canvas.width = size.width * SCALE;
		canvas.height = size.height * SCALE;

		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("word.error.canvas-error");

		await new Promise((resolve, reject) => {
			image.onload = resolve;
			image.onerror = () => reject(new Error(t("word.error.load-image-error")));
		});

		ctx.drawImage(image, 0, 0, size.width * SCALE, size.height * SCALE);

		return new Promise((resolve) => {
			canvas.toBlob((blob) => resolve(blob));
		});
	}

	static async getImageFromDiagramString(svgCode: string, fitContent = false, maxWidth?: number) {
		const image = await this.getImageFromDom(svgCode, fitContent);
		const size = await this.getImageSizeFromImageData(image, maxWidth);

		return this._getImageRun(await image.arrayBuffer(), size);
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
