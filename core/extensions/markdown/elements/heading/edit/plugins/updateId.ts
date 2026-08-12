import UpdateHeadingId from "@ext/markdown/elements/heading/edit/views/UpdateHeadingId";
import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

function updateId(editor: Editor): Plugin {
	return new Plugin({
		key: new PluginKey("heading-updateId"),
		view: (editorView) => {
			return new UpdateHeadingId(editorView, editor);
		},
	});
}

export default updateId;
