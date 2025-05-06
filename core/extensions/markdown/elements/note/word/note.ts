import DefaultError from "@ext/errorHandlers/logic/DefaultError";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { WordBlockType } from "../../../../wordExport/options/wordExportSettings";
import { createBlock } from "@ext/wordExport/createBlock";

const wordNoteTypeMap: Record<string, WordBlockType> = {
	note: WordBlockType.noteTable,
	lab: WordBlockType.labTable,
	tip: WordBlockType.tipTable,
	info: WordBlockType.infoTable,
	danger: WordBlockType.dangerTable,
	hotfixes: WordBlockType.hotfixesTable,
	quote: WordBlockType.quoteTable,
};

const wordNoteTitleTypeMap: Record<string, WordBlockType> = {
	note: WordBlockType.note,
	lab: WordBlockType.lab,
	tip: WordBlockType.tip,
	info: WordBlockType.info,
	danger: WordBlockType.danger,
	hotfixes: WordBlockType.hotfixes,
	quote: WordBlockType.quote,
};

export const noteWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	const attrs = "attributes" in tag ? tag.attributes : tag.attrs;
	if (!attrs?.type) return [];

	const moduleType = wordNoteTitleTypeMap[attrs?.type];
	const style = wordNoteTypeMap[attrs?.type];

	if (!moduleType) {
		throw new DefaultError("Need to add this note type to wordNoteTitleTypeMap", null, {
			errorCode: "wordNotFound",
			type: "note",
		});
	}

	if (!style) {
		throw new DefaultError("Need to add this note type to wordNoteTypeMap", null, {
			errorCode: "wordNotFound",
			type: "note",
		});
	}

	return createBlock(state, tag, addOptions, moduleType, style);
};
