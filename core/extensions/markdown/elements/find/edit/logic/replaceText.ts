import collectTextblockMatches from "@ext/markdown/elements/find/edit/logic/collectTextblockMatches";
import { TextSelection } from "prosemirror-state";
import type { EditorView } from "prosemirror-view";

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

	const matches = collectTextblockMatches(doc, searchTerm, caseSensitive, wholeWord);
	if (!matches.length) return;

	let shift = 0;
	let lastPos = 0;

	matches.forEach(({ start, end, marks }) => {
		const from = start + shift;
		const to = end + shift;

		if (!newText) tr.delete(from, to);
		else tr.replaceWith(from, to, state.schema.text(newText, marks));

		lastPos = from + newText.length;
		shift += newText.length - (end - start);
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

	const matchesStack = collectTextblockMatches(doc, searchTerm, caseType, wholeWord);

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
