import { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import UpdateHeadingId from "../views/UpdateHeadingId";

function updateId(editor: Editor): Plugin {
	return new Plugin({
		key: new PluginKey("heading-updateId"),
		view: (editorView) => {
			return new UpdateHeadingId(editorView, editor);
		},
	});
}

export default updateId;
