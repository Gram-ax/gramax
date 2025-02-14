import Parser from "@ext/markdown/core/Parser/Parser";
import {
	starPasteRegex as emPasteRegex,
	underscorePasteRegex as underscoreEmPasteRegex,
} from "@ext/markdown/elements/em/edit/em";
import {
	starPasteRegex as strongPasteRegex,
	underscorePasteRegex as underscoreStrongPasteRegex,
} from "@ext/markdown/elements/strong/edit/strong";
import { Slice } from "@tiptap/pm/model";
import { Transaction } from "@tiptap/pm/state";
import { EditorView } from "@tiptap/pm/view";
import { handlePaste } from "prosemirror-tables";

const bulletRegex = /^\s*([-+*])\s.*/gm;
const orderedListRegex = /^\s*(\d+\.)\s.*/gm;
const linkRegex = /^\s*\[(.*?)\]\((.*?)\)/gm;
const headingRegex = /(#{1,4}).*(\r\n|\r|\n)/gm;
const tableRegex = /((?:\| *[^|\r\n]+ *)+\|)(?:\r?\n)((?:\|[ :]?-+[ :]?)+\|)((?:(?:\r?\n)(?:\| *[^|\r\n]+ *)+\|)+)/gm;

const insertSlice = (tr: Transaction, view: EditorView, slice: Slice) => {
	tr.replaceSelection(slice);
	tr.setMeta("paste", true);
	tr.setMeta("uiEvent", "paste");
	view.dispatch(tr);
};

export const isMarkdownText = (text: string) => {
	const regexTest = [
		headingRegex,
		emPasteRegex,
		strongPasteRegex,
		underscoreEmPasteRegex,
		underscoreStrongPasteRegex,
		bulletRegex,
		orderedListRegex,
		linkRegex,
		tableRegex,
	];

	return regexTest.some((regex) => regex.test(text));
};

const handlePasteMarkdown = async (view: EditorView, event: ClipboardEvent, slice: Slice) => {
	const text = event.clipboardData?.getData("text/plain");
	try {
		const parser = new Parser();
		const editTree = await parser.editParse(text);

		const slice = Slice.fromJSON(view.state.schema, editTree);
		insertSlice(view.state.tr, view, slice);
	} catch {
		handlePaste(view, null, slice);
	}
};

export default handlePasteMarkdown;
