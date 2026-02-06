import Path from "@core/FileProvider/Path/Path";
import ResourceManager from "@core/Resource/ResourceManager";
import t from "@ext/localization/locale/translate";
import { Crop, ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { BaseImageProcessor } from "@ext/markdown/elements/image/export/BaseImageProcessor";
import { ImageDimensionsFinder } from "@ext/markdown/elements/image/word/ImageDimensionsFinder";
import Annotation from "@ext/markdown/elements/image/word/imageEditor/Annotation";
import Square from "@ext/markdown/elements/image/word/imageEditor/Square";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";
import { MAX_HEIGHT, SCALE } from "@ext/wordExport/options/wordExportSettings";

export interface GetImageByPathOptions {
	path: Path;
	resourceManager: ResourceManager;
	defaultValue: number;
	maxWidth?: number;
	maxHeight?: number;
	crop?: Crop;
	objects?: ImageObject[];
	scale?: number;
}

export interface GetImageByPathResult {
	imageBuffer: Buffer;
	size: ImageDimensions;
}

export class NextImageProccessor extends BaseImageProcessor {
	static async getImageByPath(options: GetImageByPathOptions): Promise<GetImageByPathResult> {
		const { path, resourceManager, defaultValue, maxWidth, maxHeight, crop, objects, scale } = options;

		if (path.extension === "svg+xml") return await this.getImageFromSvgPath(path, resourceManager);
		const imageBuffer = await this.getFileByPath(path, resourceManager);
		const scaleMaxWidth = this._calculateScaledDimension(maxWidth, defaultValue, scale);
		const scaleMaxHeight = this._calculateScaledDimension(maxHeight, MAX_HEIGHT, scale);

		const initialSize = await ImageDimensionsFinder.getImageSizeFromImageData(imageBuffer);
		const { imageBuffer: croppedImageBuffer, size: croppedSize } = await this._cropImage(
			imageBuffer,
			imageBuffer,
			initialSize,
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
			croppedImageBuffer,
			objects,
			scaleMaxWidth,
			defaultValue,
		);

		return { imageBuffer: finalImageBuffer, size: newSize };
	}

	private static async _cropImage(imageBuffer: Buffer, image: Buffer, size: ImageDimensions, crop?: Crop) {
		if (this._isCropRequired(crop)) {
			imageBuffer = Buffer.from(await this._cropImageToBuffer(image, crop, size));
			size = await ImageDimensionsFinder.getImageSizeFromImageData(imageBuffer);
		}
		return { imageBuffer, size };
	}

	private static _isCropRequired(crop?: Crop): boolean {
		if (!crop) return false;
		return !(crop.x === 0 && crop.y === 0 && crop.w === 100 && crop.h === 100);
	}

	private static async _cropImageToBuffer(
		imageBuffer: Buffer,
		crop: Crop,
		size: ImageDimensions,
	): Promise<Uint8Array> {
		const { createCanvas, loadImage } = await import("canvas");

		const cropX = Math.round((size.width * crop.x) / 100);
		const cropY = Math.round((size.height * crop.y) / 100);
		const cropW = Math.round((size.width * crop.w) / 100);
		const cropH = Math.round((size.height * crop.h) / 100);

		const image = await loadImage(imageBuffer);

		const canvas = createCanvas(cropW, cropH);
		const ctx = canvas.getContext("2d");

		ctx.drawImage(image, -cropX, -cropY);

		const croppedImageBuffer = canvas.toBuffer("image/png");

		return new Uint8Array(croppedImageBuffer);
	}

	private static async _addObjectsToImage(
		size: ImageDimensions,
		imageBuffer: Buffer,
		objects?: ImageObject[],
		maxWidth?: number,
		defaultValue?: number,
	): Promise<Buffer> {
		if (objects?.length > 0) {
			const { createCanvas, loadImage } = await import("canvas");

			const image = await loadImage(imageBuffer);

			const canvas = createCanvas(size.width * SCALE, size.height * SCALE);
			const ctx = canvas.getContext("2d");

			if (!ctx) throw new Error(t("word.error.canvas-error"));

			ctx.scale(SCALE, SCALE);
			ctx.drawImage(image, 0, 0, size.width, size.height);

			objects.forEach((object, index) => {
				if (object.type === "square") {
					new Square(maxWidth ?? defaultValue, size.width).draw(
						ctx as unknown as CanvasRenderingContext2D,
						object,
						(index + 1).toString(),
						size,
						objects.length > 1,
					);
				} else if (object.type === "annotation") {
					new Annotation(maxWidth ?? defaultValue, size.width).draw(
						ctx as unknown as CanvasRenderingContext2D,
						object,
						(index + 1).toString(),
						size,
						objects.length > 1,
					);
				}
			});

			return canvas.toBuffer("image/png");
		}
		return imageBuffer;
	}
}
