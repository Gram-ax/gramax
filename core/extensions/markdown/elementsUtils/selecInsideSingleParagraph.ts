import { EditorState, TextSelection } from "prosemirror-state";

export function selecInsideSingleParagraph(state: EditorState) {
	const { selection, doc } = state;

	if (!(selection instanceof TextSelection)) return false;
	if (selection.empty) return true;

	const from = selection.from;
	const to = selection.to;
	const commonAncestor = doc.resolve(from).sharedDepth(to);
	const blockName = doc?.resolve(from)?.node(commonAncestor)?.type?.name;
	const isSingleParagraph = blockName === "paragraph" || blockName === "heading";
	if (isSingleParagraph) {
		const fromNode = doc.resolve(from).node(commonAncestor);
		const toNode = doc.resolve(to).node(commonAncestor);
		return fromNode === toNode;
	}

	return false;
}
