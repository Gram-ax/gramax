import type { Editor } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "prosemirror-model";

export default interface KeyboardRulesProps {
	editor: Editor;
	typeName: string;
	node: ProseMirrorNode;
	parentNode: ProseMirrorNode;
	nodePosition: number;
}
