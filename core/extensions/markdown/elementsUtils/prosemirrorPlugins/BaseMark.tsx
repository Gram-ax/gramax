import { Editor } from "@tiptap/core";
import { EditorView } from "prosemirror-view";
import Base from "./Base";

abstract class BaseMark extends Base {
	constructor(view: EditorView, editor: Editor) {
		super(view, editor);
	}
}

export default BaseMark;
