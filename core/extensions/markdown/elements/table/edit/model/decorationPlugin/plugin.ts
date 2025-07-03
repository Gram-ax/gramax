import { Plugin, PluginKey } from "prosemirror-state";
import { DecorationSet } from "prosemirror-view";

const decorationPluginKey = new PluginKey("hoverDecorations");

const decorationPlugin = new Plugin({
	key: decorationPluginKey,
	state: {
		init() {
			return DecorationSet.empty;
		},
		apply(tr, set) {
			const addDecoration = tr.getMeta("addDecoration");
			const removeDecoration = tr.getMeta("removeDecoration");

			if (removeDecoration) set = DecorationSet.empty;

			if (addDecoration) {
				if (Array.isArray(addDecoration)) set = set.add(tr.doc, addDecoration);
				else set = set.add(tr.doc, [addDecoration]);
			}

			return set;
		},
	},
	props: {
		decorations(state) {
			return this.getState(state);
		},
	},
});

export default decorationPlugin;
