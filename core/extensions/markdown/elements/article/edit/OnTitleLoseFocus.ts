import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";

const OnTitleLoseFocus = Extension.create({
	name: "OnTitleLoseFocus",

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("OnTitleLoseFocus"),
				appendTransaction: (_, oldState, newState) => {
					const { selection: newSelection } = newState;
					const { selection: oldSelection } = oldState;

					if (oldSelection.$anchor.parent !== oldState.doc.firstChild) return;
					if (newSelection.$anchor.parent === newState.doc.firstChild) return;
					if (this.options.onTitleLoseFocus)
						this.options.onTitleLoseFocus({ newTitle: newState.doc.firstChild.textContent });

					return null;
				},
			}),
		];
	},
});

export default OnTitleLoseFocus;
