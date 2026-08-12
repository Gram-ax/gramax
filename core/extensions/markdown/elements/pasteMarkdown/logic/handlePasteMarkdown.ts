import Parser from "@ext/markdown/core/Parser/Parser";
import { markdownDetection } from "@ext/markdown/elements/pasteMarkdown/logic/markdownDetection";
import { Slice } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import { handlePaste } from "prosemirror-tables";

const insertSlice = (tr: Transaction, view: EditorView, slice: Slice) => {
	tr.replaceSelection(slice);
	tr.setMeta("paste", true);
	tr.setMeta("uiEvent", "paste");
	view.dispatch(tr);
};

export const isMarkdownText = (text: string) => {
	if (!text) return false;

	return Object.values(markdownDetection).some(({ regexp }) => {
		regexp.lastIndex = 0;
		return regexp.test(text);
	});
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
