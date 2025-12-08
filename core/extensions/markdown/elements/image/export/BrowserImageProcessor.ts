import t from "@ext/localization/locale/translate";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import Annotation from "@ext/markdown/elements/image/word/imageEditor/Annotation";
import Square from "@ext/markdown/elements/image/word/imageEditor/Square";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { MAX_HEIGHT, SCALE } from "@ext/wordExport/options/wordExportSettings";
import { GetImageByPathOptions, GetImageByPathResult } from "@ext/markdown/elements/image/export/NextImageProcessor";
import hasValidCrop from "@ext/markdown/elements/image/edit/logic/hasValidCrop";

export class BrowserImageProccessor extends BaseImageProcessor {
	static async getImageByPath(options: GetImageByPathOptions): Promise<GetImageByPathResult> {
		const { path, resourceManager, defaultValue, maxWidth, maxHeight, crop, objects, scale } = options;

		if (path.extension === "svg+xml") return await this.getImageFromSvgPath(path, resourceManager);

		const imageBuffer = await this.getFileByPath(path, resourceManager);
		const scaleMaxWidth = this._calculateScaledDimension(maxWidth, defaultValue, scale);
		const scaleMaxHeight = this._calculateScaledDimension(maxHeight, MAX_HEIGHT, scale);

		const size = await ImageDimensionsFinder.getImageSizeFromImageData(imageBuffer);
		const image = await this._createImageFromBuffer(imageBuffer);
		const { imageBuffer: croppedImageBuffer, image: croppedImage } = await this._cropImage(
			imageBuffer,
			image,
			size,
			crop,
		);

		const newSize = await ImageDimensionsFinder.getImageSizeFromImageData(
			croppedImageBuffer,
			scaleMaxWidth,
			scaleMaxHeight,
		);

		!scale || this._scaleSize(newSize, scaleMaxWidth);
		const finalImageBuffer = await this._addObjectsToImage(
			newSize,
			croppedImage,
			croppedImageBuffer,
			objects,
			scaleMaxWidth,
			defaultValue,
		);

		return { imageBuffer: finalImageBuffer, size: newSize };
	}

	private static _createImageFromBuffer(buffer: Buffer): Promise<HTMLImageElement> {
		return new Promise((resolve, reject) => {
			const image = new Image();
			image.onload = () => resolve(image);
			image.onerror = (err) => reject(err);
			image.src = URL.createObjectURL(new Blob([buffer]));
		});
	}

	private static async _cropImage(imageBuffer: Buffer, image: HTMLImageElement, size: ImageDimensions, crop?: Crop) {
		if (hasValidCrop(crop ?? undefined)) {
			imageBuffer = Buffer.from(await this._cropImageToBuffer(image, crop, size));
			size = await ImageDimensionsFinder.getImageSizeFromImageData(imageBuffer);

			image = await this._createImageFromBuffer(imageBuffer);
		}
		return { imageBuffer, image, size };
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

	private static async _addObjectsToImage(
		size: ImageDimensions,
		image: HTMLImageElement,
		imageBuffer: Buffer,
		objects?: ImageObject[],
		maxWidth?: number,
		defaultValue?: number,
	) {
		if (objects?.length > 0) {
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");

			if (!ctx) throw new Error(t("word.error.canvas-error"));

			canvas.width = size.width * SCALE;
			canvas.height = size.height * SCALE;
			ctx.scale(SCALE, SCALE);

			ctx.drawImage(image, 0, 0, size.width, size.height);

			objects.forEach((object, index) => {
				if (object.type === "square")
					new Square(maxWidth ?? defaultValue, size.width).draw(
						ctx,
						object,
						(index + 1).toString(),
						size,
						objects.length > 1,
					);
				else if (object.type === "annotation")
					new Annotation(maxWidth ?? defaultValue, size.width).draw(
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
}
