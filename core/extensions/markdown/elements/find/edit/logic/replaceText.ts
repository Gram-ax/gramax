import { EditorView } from "prosemirror-view";
import { Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";

type ReplaceProps = (
	view: EditorView,
	searchTerm: string,
	newText: string,
	caseSensitive: boolean,
	wholeWord: boolean,
) => void;

type ReplaceOneProps = (
	view: EditorView,
	searchTerm: string,
	newText: string,
	targetIndex: number,
	caseSensitive: boolean,
	wholeWord: boolean,
) => void;

const replaceHighlightedText: ReplaceProps = (view, searchTerm, newText, caseSensitive = false, wholeWord = false) => {
	const { state, dispatch } = view;
	const { doc, tr } = state;

	if (!searchTerm) return;

	let flags = "g";
	if (!caseSensitive) flags += "i";

	const regexString = wholeWord ? `\\b${searchTerm}\\b` : searchTerm;
	const regex = new RegExp(regexString, flags);

	let shift = 0;
	let lastPos = 0;

	doc.descendants((node: Node, pos: number) => {
		if (node.isText) {
			let match;
			while ((match = regex.exec(node.text)) !== null) {
				const start = pos + match.index + shift;
				const end = start + match[0].length;

				if (!newText) tr.delete(start, end);
				else tr.replaceWith(start, end, state.schema.text(newText));

				lastPos = start + newText.length;
				shift += newText.length - match[0].length;
			}
		}
	});

	if (tr.docChanged) {
		tr.setSelection(TextSelection.near(tr.doc.resolve(lastPos)));

		dispatch(tr);
		view.focus();
	}
};

const replaceSpecificHighlightedText: ReplaceOneProps = (view, searchTerm, newText, index, caseType, wholeWord) => {
	const { state, dispatch } = view;
	const { doc, tr } = state;

	if (!searchTerm) return;

	let flags = "g";
	if (!caseType) flags += "i";

	const regexString = wholeWord ? `\\b${searchTerm}\\b` : searchTerm;
	const regex = new RegExp(regexString, flags);

	const matchesStack: { start: number; end: number }[] = [];

	doc.descendants((node: Node, pos: number) => {
		if (node.isText) {
			let match;
			while ((match = regex.exec(node.text)) !== null) {
				const start = pos + match.index;
				const end = start + match[0].length;

				matchesStack.push({ start, end });
			}
		}
	});

	if (matchesStack.length > index) {
		const { start, end } = matchesStack[index];

		if (!newText) tr.delete(start, end);
		else tr.replaceWith(start, end, state.schema.text(newText));

		const newPos = start + newText.length;
		tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));

		if (tr.docChanged) {
			dispatch(tr);
			view.focus();
		}
	}
};

export { replaceHighlightedText, replaceSpecificHighlightedText };
