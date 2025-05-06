import generateUniqueID from "@core/utils/generateUniqueID";
import { editName } from "@ext/markdown/elements/blockContentField/consts";
import BlockContentFieldComponent from "@ext/markdown/elements/blockContentField/edit/components/BlockContentFieldComponent";
import blockFieldSchema from "@ext/markdown/elements/blockContentField/edit/models/blockFieldSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		"block-field": { setBlockField: () => ReturnType };
	}
}

interface BlockContentFieldOptions {
	editable: boolean;
}

const BlockContentField = Node.create<BlockContentFieldOptions>({
	...getExtensionOptions({ schema: blockFieldSchema, name: editName }),

	content() {
		return this.options.editable && "block+";
	},

	addOptions() {
		return {
			editable: false,
		};
	},

	parseHTML() {
		return [{ tag: "block-field" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["block-field", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(BlockContentFieldComponent);
	},

	addCommands() {
		return {
			setBlockField:
				() =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: {
							bind: "field-" + generateUniqueID(),
						},
						content: [],
					});
				},
		};
	},
});

export default BlockContentField;
