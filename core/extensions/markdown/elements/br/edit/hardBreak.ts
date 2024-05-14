import br from "@ext/markdown/elements/br/edit/model/brSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { splitBlock } from "prosemirror-commands";
import { Plugin, PluginKey } from "prosemirror-state";

interface HardBreakOptions {
	keepMarks: boolean;
	HTMLAttributes: Record<string, any>;
}

const HardBreak = Node.create<HardBreakOptions>({
	...getExtensionOptions({ schema: br, name: "hard_break" }),

	addOptions() {
		return {
			keepMarks: true,
			HTMLAttributes: {},
		};
	},

	parseHTML() {
		return [{ tag: "br" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["br", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
	},

	renderText() {
		return "\n";
	},

	addProseMirrorPlugins() {
		return [
			new Plugin({
				key: new PluginKey("Shift-Enter_br"),
				props: {
					handleKeyDown: (view, event) => {
						if (event.key === "Enter" && event.shiftKey) {
							splitBlock(view.state, view.dispatch);
						}
					},
				},
			}),
		];
	},
});

export default HardBreak;
