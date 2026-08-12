import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import FileFocusTooltip from "../../logic/FileFocusTooltip";

export function editTooltip(editor: Editor): Plugin {
	return new Plugin({
		key: new PluginKey("fileTooltip"),
		view: (editorView) => {
			return new FileFocusTooltip(editorView, editor);
		},
	});
}
