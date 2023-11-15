import { Editor } from "@tiptap/core";
import { Node as ProseMirrorNode } from "prosemirror-model";

export default interface KeyboardRulesProps {
	editor: Editor;
	typeName: string;
	node: ProseMirrorNode;
	parentNode: ProseMirrorNode;
	nodePosition: number;
}
