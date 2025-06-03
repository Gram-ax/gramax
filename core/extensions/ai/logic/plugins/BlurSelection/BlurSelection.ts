import {
	DECO_NAME,
	SAVE_SELECTION_META_KEY,
	RESTORE_SELECTION_META_KEY,
	DECO_CLASS,
} from "@ext/ai/logic/plugins/BlurSelection/consts";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const BlurSelection = new Plugin({
	key: new PluginKey(DECO_NAME),
	state: {
		init() {
			return DecorationSet.empty;
		},
		apply: (transaction, oldState) => {
			const { selection, doc } = transaction;
			const isRestoreSelection = transaction.getMeta(RESTORE_SELECTION_META_KEY);
			const isSaveSelection = transaction.getMeta(SAVE_SELECTION_META_KEY);
			const hasSelection = selection && selection.from !== selection.to;

			if (!hasSelection || isRestoreSelection) {
				return DecorationSet.empty;
			}

			if (hasSelection && isSaveSelection) {
				const decoration = Decoration.inline(selection.from, selection.to, {
					class: DECO_CLASS,
				});

				return DecorationSet.create(doc, [decoration]);
			}

			return oldState;
		},
	},
	props: {
		decorations(state) {
			return this.getState(state);
		},
	},
});

export default BlurSelection;
