import blockquoteSchema from "@ext/markdown/elements/blockquote/editor/model/blockquoteSchema";
import { stopExecution } from "@ext/markdown/elementsUtils/cursorFunctions";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node, wrappingInputRule } from "@tiptap/core";

export interface BlockquoteOptions {
	HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		blockQuote: {
			setBlockquote: () => ReturnType;
			toggleBlockquote: () => ReturnType;
			unsetBlockquote: () => ReturnType;
		};
	}
}

export const inputRegex = /^\s*>\s$/;

const Blockquote = Node.create<BlockquoteOptions>({
	...getExtensionOptions({ schema: blockquoteSchema, name: "blockquote" }),

	addOptions() {
		return {
			HTMLAttributes: {},
		};
	},

	defining: true,

	parseHTML() {
		return [{ tag: "blockquote" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["blockquote", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
	},

	addCommands() {
		return {
			setBlockquote:
				() =>
				({ commands }) => {
					return commands.wrapIn(this.name);
				},
			toggleBlockquote:
				() =>
				({ commands, editor }) => {
					if (stopExecution(editor, this.name)) return false;

					return commands.toggleWrap(this.name);
				},
			unsetBlockquote:
				() =>
				({ commands }) => {
					return commands.lift(this.name);
				},
		};
	},

	addInputRules() {
		return [
			wrappingInputRule({
				find: inputRegex,
				type: this.type,
			}),
		];
	},
});

export default Blockquote;
