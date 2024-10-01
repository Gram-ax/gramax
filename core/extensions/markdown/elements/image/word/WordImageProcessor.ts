import resolveModule from "@app/resolveModule/backend";
import { ImageRun } from "docx";
import Path from "../../../../../logic/FileProvider/Path/Path";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import t from "@ext/localization/locale/translate";
import Square from "@ext/markdown/elements/image/word/imageEditor/Square";
import Annotation from "@ext/markdown/elements/image/word/imageEditor/Annotation";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { MAX_HEIGHT, MAX_WIDTH, SCALE } from "@ext/wordExport/options/wordExportSettings";
import { getExecutingEnvironment } from "@app/resolveModule/env";
import { ImageDimensionsFinder } from "./ImageDimensionsFinder";

export class WordImageProcessor {
	static async getFileByPath(path: Path, resourceManager: ResourceManager) {
		const content = await resourceManager.getContent(path);
		if (!content) throw new Error(`${t("word.error.file-not-found-error")}: ${path.toString()}`);
		return content;
	}

	static async getImageByPath(
		path: Path,
		resourceManager: ResourceManager,
		maxWidth?: number,
		maxHeight?: number,
		crop?: Crop,
		objects?: ImageObject[],
		scale?: number,
	) {
		if (path.extension === "svg") return this.getImageFromSvgPath(path, resourceManager);

		let imageBuffer = await this.getFileByPath(path, resourceManager);

		const scaleMaxWidth = this._calculateScaledDimension(maxWidth, MAX_WIDTH, scale);
		const scaleMaxHeight = this._calculateScaledDimension(maxHeight, MAX_HEIGHT, scale);

		if (getExecutingEnvironment() !== "next") {
			let size = await ImageDimensionsFinder.getImageSizeFromImageData(imageBuffer);
			let image = await this._createImageFromBuffer(imageBuffer);

			({ imageBuffer, image, size } = await WordImageProcessor._cropImage(imageBuffer, image, size, crop));

			this._scaleSize(size, scaleMaxWidth, !!scale);

			imageBuffer = await WordImageProcessor._addObjectsToImage(size, image, imageBuffer, objects, scaleMaxWidth);
		}

		const size = await ImageDimensionsFinder.getImageSizeFromImageData(imageBuffer, scaleMaxWidth, scaleMaxHeight);
		this._scaleSize(size, scaleMaxWidth, !!scale);

		return this._getImageRun(imageBuffer, size);
	}

	private static _calculateScaledDimension(value?: number, defaultValue?: number, scale?: number): number {
		if (!scale) return value ?? defaultValue;
		return value ? (value * scale) / 100 : (defaultValue * scale) / 100;
	}

	private static _scaleSize(size: ImageDimensions, targetWidth: number, isScale: boolean) {
		if (isScale) {
			size.height = (size.height * targetWidth) / size.width;
			size.width = targetWidth;
		}
	}

	private static async _addObjectsToImage(
		size: ImageDimensions,
		image: HTMLImageElement,
		imageBuffer: Buffer,
		objects?: ImageObject[],
		maxWidth?: number,
	) {
		if (objects?.length > 0) {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) throw new Error(t("word.error.canvas-error"));

			canvas.width = size.width;
			canvas.height = size.height;

			ctx.drawImage(image, 0, 0, size.width, size.height);

			objects.forEach((object, index) => {
				if (object.type === "square")
					new Square(maxWidth ?? MAX_WIDTH, size.width).draw(
						ctx,
						object,
						(index + 1).toString(),
						size,
						objects.length > 1,
					);
				else if (object.type === "annotation")
					new Annotation(maxWidth ?? MAX_WIDTH, size.width).draw(
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
		}
		return imageBuffer;
	}

	private static async _cropImage(imageBuffer: Buffer, image: HTMLImageElement, size: ImageDimensions, crop?: Crop) {
		if (crop) {
			imageBuffer = Buffer.from(await this._cropImageToBuffer(image, crop, size));
			size = await ImageDimensionsFinder.getImageSizeFromImageData(imageBuffer);
			image = await this._createImageFromBuffer(imageBuffer);
		}
		return { imageBuffer, image, size };
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
		const size = ImageDimensionsFinder.getSvgDimensions(svgCode, maxWidth);
		const image = await this.svgToPng(svgCode, size);
		return this._getImageRun(image, size);
	}

	static async svgToPng(svgCode: string, size: ImageDimensions): Promise<Buffer> {
		const svgToPng = resolveModule("svgToPng");
		return svgToPng(svgCode, size, SCALE);
	}

	static async getImageFromDiagramString(svgCode: string, fitContent = false, maxWidth?: number) {
		const image = await this.getImageFromDom(svgCode, fitContent);
		return this._getImageRun(
			image,
			await ImageDimensionsFinder.getImageSizeFromImageData(Buffer.from(image), maxWidth ?? MAX_WIDTH),
		);
	}

	static async getImageFromDom(tag: string, fitContent = true) {
		const getImageFromDom = resolveModule("getImageFromDom");
		return getImageFromDom(tag, fitContent);
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
