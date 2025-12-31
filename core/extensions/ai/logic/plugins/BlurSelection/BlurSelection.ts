import { DECO_CLASS, DECO_NAME } from "@ext/ai/logic/plugins/BlurSelection/consts";
import { Editor, isNodeSelection } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const BlurSelection = (editor: Editor) =>
	new Plugin({
		key: new PluginKey(DECO_NAME),
		props: {
			decorations(state) {
				if (
					state.selection.empty ||
					editor.isFocused ||
					!editor.isEditable ||
					isNodeSelection(state.selection) ||
					editor.view.dragging
				) {
					return null;
				}

				return DecorationSet.create(state.doc, [
					Decoration.inline(
						state.selection.from,
						state.selection.to,
						{
							class: DECO_CLASS,
						},
						{ inclusiveStart: false, inclusiveEnd: false },
					),
				]);
			},
		},
	});

export default BlurSelection;
