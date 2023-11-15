import { Node as ProseMirrorNode } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";
import { liftTarget } from "prosemirror-transform";

const liftNode = (state: EditorState, tr: Transaction, node: ProseMirrorNode, pos: number) => {
	const startRangePos = state.doc.resolve(pos + 1 + (node.isAtom ? -1 : 0));
	const nodeRange = state.doc.resolve(pos + node.nodeSize).blockRange(startRangePos);
	const target = liftTarget(nodeRange);

	tr.lift(nodeRange, target);
};

export default liftNode;
