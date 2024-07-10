/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License.
 *--------------------------------------------------------------------------------------------*/
import { editor } from "monaco-editor";
import type * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import * as interfaces from "../model/interfaces";
import { getTextLine } from "./extHostDocumentLine";

export const GitMarkers = {
	startHeader: "<<<<<<<",
	commonAncestors: "|||||||",
	splitter: "=======",
	endFooter: ">>>>>>>",
};

const startHeaderMarker = GitMarkers.startHeader;
const commonAncestorsMarker = GitMarkers.commonAncestors;
const splitterMarker = GitMarkers.splitter;
const endFooterMarker = GitMarkers.endFooter;

interface IScanMergedConflict {
	startHeader: interfaces.TextLine;
	commonAncestors: interfaces.TextLine[];
	splitter?: interfaces.TextLine;
	endFooter?: interfaces.TextLine;
}

export class MergeConflictParser {
	constructor(private _monaco: typeof monaco) {}

	scanDocument(model: editor.ITextModel): interfaces.IDocumentMergeConflictDescriptor[] {
		if (!MergeConflictParser.containsConflict(model.getValue())) return [];

		// Scan each line in the document, we already know there is at least a <<<<<<< and
		// >>>>>> marker within the document, we need to group these into conflict ranges.
		// We initially build a scan match, that references the lines of the header, splitter
		// and footer. This is then converted into a full descriptor containing all required
		// ranges.

		let currentConflict: IScanMergedConflict | null = null;
		const conflictDescriptors: interfaces.IDocumentMergeConflictDescriptor[] = [];

		// VScode use `for (let i = 0; i < document.lineCount; i++)` its start numbers are 0,0. In Monaco - 1,1.
		for (let i = 1; i < model.getLineCount() + 1; i++) {
			const line = getTextLine(this._monaco, model, i);

			// Ignore empty lines
			if (!line || line.isEmptyOrWhitespace) {
				continue;
			}

			// Is this a start line? <<<<<<<
			if (line.text.startsWith(startHeaderMarker)) {
				if (currentConflict !== null) {
					// Error, we should not see a startMarker before we've seen an endMarker
					currentConflict = null;

					// Give up parsing, anything matched up this to this point will be decorated
					// anything after will not
					break;
				}

				// Create a new conflict starting at this line
				currentConflict = { startHeader: line, commonAncestors: [] };
			}
			// Are we within a conflict block and is this a common ancestors marker? |||||||
			else if (currentConflict && !currentConflict.splitter && line.text.startsWith(commonAncestorsMarker)) {
				currentConflict.commonAncestors.push(line);
			}
			// Are we within a conflict block and is this a splitter? =======
			else if (currentConflict && !currentConflict.splitter && line.text === splitterMarker) {
				currentConflict.splitter = line;
			}
			// Are we within a conflict block and is this a footer? >>>>>>>
			else if (currentConflict && line.text.startsWith(endFooterMarker)) {
				currentConflict.endFooter = line;

				// Create a full descriptor from the lines that we matched. This can return
				// null if the descriptor could not be completed.
				const completeDescriptor = this.scanItemTolMergeConflictDescriptor(model, currentConflict);

				if (completeDescriptor !== null) {
					conflictDescriptors.push(completeDescriptor);
				}

				// Reset the current conflict to be empty, so we can match the next
				// starting header marker.
				currentConflict = null;
			}
		}

		return conflictDescriptors.filter(Boolean);
	}

	private scanItemTolMergeConflictDescriptor(
		model: editor.ITextModel,
		scanned: IScanMergedConflict,
	): interfaces.IDocumentMergeConflictDescriptor | null {
		// Validate we have all the required lines within the scan item.
		if (!scanned.startHeader || !scanned.splitter || !scanned.endFooter) {
			return null;
		}

		const tokenAfterCurrentBlock: interfaces.TextLine = scanned.commonAncestors[0] || scanned.splitter;

		// Assume that descriptor.current.header, descriptor.incoming.header and descriptor.splitter
		// have valid ranges, fill in content and total ranges from these parts.
		// NOTE: We need to shift the decorator range back one character so the splitter does not end up with
		// two decoration colors (current and splitter), if we take the new line from the content into account
		// the decorator will wrap to the next line.
		return {
			current: {
				header: scanned.startHeader.range,
				decoratorContent: this.makeRange(
					scanned.startHeader.rangeIncludingLineBreak.getEndPosition(),
					this.shiftBackOneCharacter(
						model,
						tokenAfterCurrentBlock.range.getStartPosition(),
						scanned.startHeader.rangeIncludingLineBreak.getEndPosition(),
					),
				),
				// Current content is range between header (shifted for linebreak) and splitter or common ancestors mark start
				content: this.makeRange(
					scanned.startHeader.rangeIncludingLineBreak.getEndPosition(),
					tokenAfterCurrentBlock.range.getStartPosition(),
				),
				name: scanned.startHeader.text.substring(startHeaderMarker.length + 1),
			},
			commonAncestors: scanned.commonAncestors.map((currentTokenLine, index, commonAncestors) => {
				const nextTokenLine = commonAncestors[index + 1] || scanned.splitter;
				return {
					header: currentTokenLine.range,
					decoratorContent: this.makeRange(
						currentTokenLine.rangeIncludingLineBreak.getEndPosition(),
						this.shiftBackOneCharacter(
							model,
							nextTokenLine.range.getStartPosition(),
							currentTokenLine.rangeIncludingLineBreak.getEndPosition(),
						),
					),
					// Each common ancestors block is range between one common ancestors token
					// (shifted for linebreak) and start of next common ancestors token or splitter
					content: this.makeRange(
						currentTokenLine.rangeIncludingLineBreak.getEndPosition(),
						nextTokenLine.range.getStartPosition(),
					),
					name: currentTokenLine.text.substring(commonAncestorsMarker.length + 1),
				};
			}),
			splitter: scanned.splitter.range,
			incoming: {
				header: scanned.endFooter.range,
				decoratorContent: this.makeRange(
					scanned.splitter.rangeIncludingLineBreak.getEndPosition(),
					this.shiftBackOneCharacter(
						model,
						scanned.endFooter.range.getStartPosition(),
						scanned.splitter.rangeIncludingLineBreak.getEndPosition(),
					),
				),
				// Incoming content is range between splitter (shifted for linebreak) and footer start
				content: this.makeRange(
					scanned.splitter.rangeIncludingLineBreak.getEndPosition(),
					scanned.endFooter.range.getStartPosition(),
				),
				name: scanned.endFooter.text.substring(endFooterMarker.length + 1),
			},
			// Entire range is between current header start and incoming header end (including line break)
			range: this.makeRange(
				scanned.startHeader.range.getStartPosition(),
				scanned.endFooter.range.getEndPosition(),
			),
		};
	}

	static containsConflict(text: string): boolean {
		if (!text) {
			return false;
		}

		return text.includes(startHeaderMarker) && text.includes(endFooterMarker) && text.includes(splitterMarker);
	}

	private shiftBackOneCharacter(model: editor.ITextModel, range: monaco.Position, unlessEqual: monaco.Position): any {
		if (range.equals(unlessEqual)) {
			return range;
		}

		let line = range.lineNumber;
		let character = range.column - 1;

		// VScode use `character < 0` because its start numbers are 0,0. Monaco - 1,1.
		if (character < 1) {
			line--;
			character = getTextLine(this._monaco, model, line).range.getEndPosition().column;
		}

		return new this._monaco.Position(line, character);
	}

	makeRange(pos1: monaco.Position, pos2: monaco.Position): monaco.Range {
		return new this._monaco.Range(pos1.lineNumber, pos1.column, pos2.lineNumber, pos2.column);
	}
}
