import { EditorView } from "prosemirror-view";
import { Mark, Node } from "prosemirror-model";
import { TextSelection } from "prosemirror-state";
import buildSearchRegex from "./buildSearchRegex";

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

	const regex = buildSearchRegex(searchTerm, caseSensitive, wholeWord);

	let shift = 0;
	let lastPos = 0;

	doc.descendants((node: Node, pos: number) => {
		if (node.isText) {
			let match;
			while ((match = regex.exec(node.text)) !== null) {
				const start = pos + match.index + shift;
				const end = start + match[0].length;

				if (!newText) tr.delete(start, end);
				else tr.replaceWith(start, end, state.schema.text(newText, node.marks));

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

	const regex = buildSearchRegex(searchTerm, caseType, wholeWord);

	const matchesStack: { start: number; end: number; marks: readonly Mark[] }[] = [];

	doc.descendants((node: Node, pos: number) => {
		if (node.isText) {
			let match;
			while ((match = regex.exec(node.text)) !== null) {
				const start = pos + match.index;
				const end = start + match[0].length;

				matchesStack.push({ start, end, marks: node.marks });
			}
		}
	});

	if (matchesStack.length > index) {
		const { start, end, marks } = matchesStack[index];

		if (!newText) tr.delete(start, end);
		else tr.replaceWith(start, end, state.schema.text(newText, marks));

		const newPos = start + newText.length;
		tr.setSelection(TextSelection.near(tr.doc.resolve(newPos)));

		if (tr.docChanged) {
			dispatch(tr);
			view.focus();
		}
	}
};

export { replaceHighlightedText, replaceSpecificHighlightedText };
