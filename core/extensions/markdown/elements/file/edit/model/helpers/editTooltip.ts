import type { Environment } from "@app/resolveModule/env";
import type PageDataContext from "@core/Context/PageDataContext";
import type { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import type ApiUrlCreator from "../../../../../../../ui-logic/ApiServices/ApiUrlCreator";
import FileFocusTooltip from "../../logic/FileFocusTooltip";

export function editTooltip(
	editor: Editor,
	apiUrlCreator: ApiUrlCreator,
	pageDataContext: PageDataContext,
	platform: Environment,
): Plugin {
	return new Plugin({
		key: new PluginKey("fileTooltip"),
		view: (editorView) => {
			return new FileFocusTooltip(editorView, editor, apiUrlCreator, pageDataContext, platform);
		},
	});
}
