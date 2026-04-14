import type { Editor } from "@tiptap/core";
import type { Node } from "prosemirror-model";
import type { EditorView } from "prosemirror-view";
import Base from "./Base";

abstract class BaseNode extends Base {
	constructor(view: EditorView, editor: Editor) {
		super(view, editor);
	}

	protected _isEmptyNode(node: Node) {
		return node.nodeSize === 0;
	}
}

export default BaseNode;
