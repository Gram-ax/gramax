import PageDataContext from "@core/Context/PageDataContext";
import { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import ApiUrlCreator from "../../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FileFocusTooltip from "../../logic/FileFocusTooltip";

export function editTooltip(editor: Editor, apiUrlCreator: ApiUrlCreator, pageDataContext: PageDataContext): Plugin {
	return new Plugin({
		key: new PluginKey("fileTooltip"),
		view: (editorView) => {
			return new FileFocusTooltip(editorView, editor, apiUrlCreator, pageDataContext);
		},
	});
}
