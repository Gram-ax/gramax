import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import Shape from "@ext/markdown/elements/image/word/imageEditor/Shape";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";

class Annotation extends Shape {
	draw(ctx: CanvasRenderingContext2D, object: ImageObject, text: string, size: ImageDimensions, isText: boolean) {
		const x = this._getPixels(size.width, object.x) + this._radius;
		const y = this._getPixels(size.height, object.y) + this._radius;

		this._drawCircle(ctx, x, y, this._radius);

		let arrowX = x;
		let arrowY = y;

		switch (object.direction) {
			case "top-left":
				arrowX -= this._radius;
				arrowY -= this._radius;
				break;
			case "top-right":
				arrowX = x;
				arrowY -= this._radius;
				break;
			case "bottom-left":
				arrowX -= this._radius;
				arrowY = y;
				break;
			case "bottom-right":
				arrowX += this._radius;
				arrowY = y;
				break;
		}

		ctx.beginPath();
		this._roundRectOneSide(
			ctx,
			arrowX,
			arrowY,
			this._radius,
			this._radius,
			this._roundedRectRadius,
			object.direction,
		);

		if (isText) this._printText(ctx, text, x, y);
	}

	private _roundRectOneSide(
		ctx: CanvasRenderingContext2D,
		x: number,
		y: number,
		width: number,
		height: number,
		radius: number,
		direction: string,
	) {
		const oldFillStyle = ctx.fillStyle;

		ctx.fillStyle = this._color;

		ctx.beginPath();

		switch (direction) {
			case "top-left":
				ctx.moveTo(x + radius, y);
				ctx.lineTo(x + width, y);
				ctx.lineTo(x + width, y + height);
				ctx.lineTo(x, y + height);
				ctx.lineTo(x, y + radius);
				ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI);
				break;
			case "top-right":
				ctx.moveTo(x, y);
				ctx.lineTo(x + width - radius, y);
				ctx.arc(x + width - radius, y + radius, radius, 1.5 * Math.PI, 2 * Math.PI);
				ctx.lineTo(x + width, y + height);
				ctx.lineTo(x, y + height);
				break;
			case "bottom-left":
				ctx.moveTo(x, y);
				ctx.lineTo(x, y + height - radius);
				ctx.arc(x + radius, y + height - radius, radius, 0.5 * Math.PI, Math.PI, false);
				ctx.lineTo(x + radius, y + height);
				ctx.lineTo(x + width, y + height);
				ctx.lineTo(x + width, y);
				break;
			case "bottom-right":
				ctx.moveTo(x - width, y);
				ctx.lineTo(x, y);
				ctx.lineTo(x, y + height - radius);
				ctx.arc(x - radius, y + height - radius, radius, 0, 0.5 * Math.PI);
				ctx.lineTo(x - width, y + height);
				break;
		}

		ctx.closePath();
		ctx.fill();

		ctx.fillStyle = oldFillStyle;
	}
}

export default Annotation;
