import t from "@ext/localization/locale/translate";
import { ImageObject, SquareObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import Shape from "@ext/markdown/elements/image/word/imageEditor/Shape";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";

class Square extends Shape {
	draw(ctx: CanvasRenderingContext2D, object: ImageObject, text: string, size: ImageDimensions, isText: boolean) {
		const squareObject = object as SquareObject;
		if (!squareObject) throw new Error(t("word.error.wrong-object-type"));

		const x = super._getPixels(size.width, object.x);
		const y = super._getPixels(size.height, object.y);
		const width = super._getPixels(size.width, squareObject.w);
		const height = super._getPixels(size.height, squareObject.h);

		this._drawRoundedRect(ctx, x, y, width, height, this._roundedRectRadius);

		if (isText) {
			switch (object.direction) {
				case "top-left":
					this._drawCircle(ctx, x, y, this._radius);
					this._printText(ctx, text, x, y);
					break;
				case "top-right":
					this._drawCircle(ctx, x + width, y, this._radius);
					this._printText(ctx, text, x + width, y);
					break;
				case "bottom-left":
					this._drawCircle(ctx, x, y + height, this._radius);
					this._printText(ctx, text, x, y + height);
					break;
				case "bottom-right":
					this._drawCircle(ctx, x + width, y + height, this._radius);
					this._printText(ctx, text, x + width, y + height);
					break;
			}
		}
	}

	private _drawRoundedRect(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
	) {
		const oldFillStyle = ctx.fillStyle;
		const oldStrokeStyle = ctx.strokeStyle;
		const oldLineWidth = ctx.lineWidth;

		ctx.fillStyle = this._color;
		ctx.strokeStyle = this._color;
		ctx.lineWidth = this._lineWidth;

		ctx.beginPath();
		ctx.moveTo(x + radius, y);
		ctx.lineTo(x + width - radius, y);
		ctx.arc(x + width - radius, y + radius, radius, -0.5 * Math.PI, 0);
		ctx.lineTo(x + width, y + height - radius);
		ctx.arc(x + width - radius, y + height - radius, radius, 0, 0.5 * Math.PI);
		ctx.lineTo(x + radius, y + height);
		ctx.arc(x + radius, y + height - radius, radius, 0.5 * Math.PI, Math.PI);
		ctx.lineTo(x, y + radius);
		ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI);
		ctx.closePath();
		ctx.stroke();

		ctx.fillStyle = oldFillStyle;
		ctx.strokeStyle = oldStrokeStyle;
		ctx.lineWidth = oldLineWidth;
	}
}

export default Square;
