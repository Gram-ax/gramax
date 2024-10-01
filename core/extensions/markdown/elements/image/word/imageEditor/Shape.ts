import t from "@ext/localization/locale/translate";
import { ImageObject } from "@ext/markdown/elements/image/edit/model/imageEditorTypes";
import { ImageDimensions } from "@ext/wordExport/options/WordTypes";

abstract class Shape {
	protected _radius = 9;
	protected _roundedRectRadius = 3;
	protected _lineWidth = 2;
	protected readonly _color = "#fc2847";

	protected _textOffset = 1.5;
	protected _font: string;
	protected readonly _fontStyle = "white";
	protected readonly _textAlign = "center";
	protected readonly _textBaseline = "middle";

	constructor(maxSize: number, size: number) {
		let fontSize = 12;
		const fontStyle = "bold";
		const fontFamily = "Roboto";

		if (maxSize < size) {
			this._radius = this._findX1(this._radius, size, maxSize);
			this._roundedRectRadius = this._findX1(this._roundedRectRadius, size, maxSize);
			this._lineWidth = this._findX1(this._lineWidth, size, maxSize);
			this._textOffset = this._findX1(this._textOffset, size, maxSize);
			fontSize = this._findX1(fontSize, size, maxSize);
		}

		this._font = `${fontStyle} ${fontSize}px ${fontFamily}`;
	}

	protected _findX1(x2: number, y1: number, y2: number): number {
		if (y2 === 0) throw new Error(t("word.error.divide-by-zero-error"));
		return (x2 * y1) / y2;
	}

	protected _getPixels(size: number, percentCoordinate: number) {
		return this._findX1(size, percentCoordinate, 100);
	}

	protected _drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
		const oldFillStyle = ctx.fillStyle;

		ctx.fillStyle = this._color;
		ctx.beginPath();
		ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
		ctx.fill();

		ctx.fillStyle = oldFillStyle;
	}

	protected _printText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
		const oldTextAlign = ctx.textAlign;
		const oldTextBaseline = ctx.textBaseline;
		const oldFillStyle = ctx.fillStyle;
		const oldFont = ctx.font;

		ctx.textAlign = this._textAlign;
		ctx.textBaseline = this._textBaseline;
		ctx.fillStyle = this._fontStyle;
		ctx.font = this._font;

		ctx.fillText(text, x, y + this._textOffset);

		ctx.textAlign = oldTextAlign;
		ctx.textBaseline = oldTextBaseline;
		ctx.fillStyle = oldFillStyle;
		ctx.font = oldFont;
	}

	abstract draw(
		ctx: CanvasRenderingContext2D,
		object: ImageObject,
		text: string,
		size: ImageDimensions,
		isText: boolean,
	): void;
}

export default Shape;
