import { Editor } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "prosemirror-view";

const addDecorations = (editor: Editor, decorations: DecorationSet, pluginKey: PluginKey) => {
	const plugin = new Plugin({
		key: pluginKey,
		props: {
			decorations() {
				return decorations;
			},
		},
	});
	const currentPlugins = editor.view.state.plugins;
	const filteredPlugins = currentPlugins.filter((p) => p.spec?.key !== pluginKey);
	const newState = editor.view.state.reconfigure({
		plugins: [...filteredPlugins, plugin],
	});
	editor.view.updateState(newState);
};

export default addDecorations;
