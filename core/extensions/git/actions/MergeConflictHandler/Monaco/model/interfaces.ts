/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";

export interface TextLine {
	/**
	 * The zero-based line number.
	 */
	readonly lineNumber: number;

	/**
	 * The text of this line without the line separator characters.
	 */
	readonly text: string;

	/**
	 * The range this line covers without the line separator characters.
	 */
	readonly range: monaco.Range;

	/**
	 * The range this line covers with the line separator characters.
	 */
	readonly rangeIncludingLineBreak: monaco.Range;

	/**
	 * The offset of the first character which is not a whitespace character as defined
	 * by `/\s/`. **Note** that if a line is all whitespace the length of the line is returned.
	 */
	readonly firstNonWhitespaceCharacterIndex: number;

	/**
	 * Whether this line is whitespace only, shorthand
	 * for {@link TextLine.firstNonWhitespaceCharacterIndex} === {@link TextLine.text TextLine.text.length}.
	 */
	readonly isEmptyOrWhitespace: boolean;
}

export interface IMergeRegion {
	name: string;
	header: monaco.Range;
	content: monaco.Range;
	decoratorContent: monaco.Range;
}

export interface IDocumentMergeConflictDescriptor {
	range: monaco.Range;
	current: IMergeRegion;
	incoming: IMergeRegion;
	commonAncestors: IMergeRegion[];
	splitter: monaco.Range;
}
