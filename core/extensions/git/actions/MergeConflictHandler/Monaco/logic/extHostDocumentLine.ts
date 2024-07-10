/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/
import { editor } from "monaco-editor";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as interfaces from "../model/interfaces";

export class ExtHostDocumentLine implements interfaces.TextLine {
	private readonly _line: number;
	private readonly _text: string;
	private readonly _isLastLine: boolean;

	constructor(private _monaco: typeof monaco, line: number, text: string, isLastLine: boolean) {
		this._line = line;
		this._text = text;
		this._isLastLine = isLastLine;
	}

	public get lineNumber(): number {
		return this._line;
	}

	public get text(): string {
		return this._text;
	}

	public get range(): monaco.Range {
		// Vscode use `new Range(this._line, 0, this._line, this._text.length)` because its start numbers are 0,0. Monaco - 1,1.
		return new this._monaco.Range(this._line, 1, this._line, this._text.length + 1);
	}

	public get rangeIncludingLineBreak(): monaco.Range {
		if (this._isLastLine) {
			return this.range;
		}
		// VScode use `new Range(this._line, 0, this._line, this._text.length)` because its start numbers are 0,0. Monaco - 1,1.
		return new this._monaco.Range(this._line, 1, this._line + 1, 1);
	}

	public get firstNonWhitespaceCharacterIndex(): number {
		//TODO@api, rename to 'leadingWhitespaceLength'
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
		return /^(\s*)/.exec(this._text)![1].length;
	}

	public get isEmptyOrWhitespace(): boolean {
		return this.firstNonWhitespaceCharacterIndex === this._text.length;
	}
}

export function getTextLine(
	monacoInstance: typeof monaco,
	model: editor.ITextModel,
	lineOrPosition: number | monaco.Position,
): interfaces.TextLine {
	const lines = model.getLinesContent();
	let line: number | undefined;
	if (lineOrPosition instanceof monacoInstance.Position) {
		line = lineOrPosition.lineNumber;
	} else if (typeof lineOrPosition === "number") {
		line = lineOrPosition;
	}

	return new ExtHostDocumentLine(monacoInstance, line, lines[line - 1], line === lines.length);
}
