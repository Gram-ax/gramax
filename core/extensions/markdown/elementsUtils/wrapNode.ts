import { Attrs, NodeType, Node as ProseMirrorNode } from "prosemirror-model";
import { EditorState, Transaction } from "prosemirror-state";

const wrapNode = (
	state: EditorState,
	tr: Transaction,
	node: ProseMirrorNode,
	pos: number,
	type: NodeType,
	attrs?: Attrs,
) => {
	const startRangePos = state.doc.resolve(pos);
	const endRangePos = state.doc.resolve(pos + node.nodeSize);
	const nodeRange = startRangePos.blockRange(endRangePos);

	tr.wrap(nodeRange, [{ type, attrs }]);
};

export default wrapNode;
