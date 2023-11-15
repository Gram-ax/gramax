import { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import ApiUrlCreator from "../../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import LinkFocusTooltip from "../../logic/LinkFocusTooltip";

export function editTooltip(editor: Editor, apiUrlCreator: ApiUrlCreator): Plugin {
	return new Plugin({
		key: new PluginKey("handleClickLink"),
		view: (editorView) => {
			return new LinkFocusTooltip(editorView, editor, apiUrlCreator);
		},
	});
}
