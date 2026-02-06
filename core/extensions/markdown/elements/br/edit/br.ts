import br from "@ext/markdown/elements/br/edit/model/brSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { Node } from "@tiptap/core";
import { splitBlock } from "prosemirror-commands";
import { Plugin, PluginKey } from "prosemirror-state";

interface BrOptions {
	keepMarks: boolean;
	HTMLAttributes: Record<string, any>;
}

const Br = Node.create<BrOptions>({
	...getExtensionOptions({ schema: br, name: "br" }),

	renderHTML() {
		return ["br"];
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("Shift-Enter"),
				props: {
					handleKeyDown: (view, event) => {
						if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
							splitBlock(view.state, view.dispatch);
						}
					},
				},
			}),
		];
	},
});

export default Br;
