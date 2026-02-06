import ElementGroups from "@ext/markdown/core/element/ElementGroups";
import { editName } from "@ext/markdown/elements/blockProperty/consts";
import BlockPropertyComponent from "@ext/markdown/elements/blockProperty/edit/components/BlockPropertyComponent";
import blockPropertySchema from "@ext/markdown/elements/blockProperty/edit/models/blockPropertySchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		"block-property": { setBlockProperty: (attributes?: { bind?: string }) => ReturnType };
	}
}

interface BlockPropertyOptions {
	canChangeProps: boolean;
}

const BlockProperty = Node.create<BlockPropertyOptions>({
	...getExtensionOptions({ schema: blockPropertySchema, name: editName }),

	content() {
		return this.options.canChangeProps && `${ElementGroups.block}+`;
	},

	addOptions() {
		return {
			canChangeProps: false,
		};
	},

	parseHTML() {
		return [{ tag: "block-property" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["block-property", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(BlockPropertyComponent);
	},

	addCommands() {
		return {
			setBlockProperty:
				(attributes) =>
				({ commands }) => {
					const content = this.options.canChangeProps ? [{ type: "paragraph" }] : [];
					return commands.insertContent({
						type: this.name,
						attrs: attributes,
						content,
					});
				},
		};
	},
});

export default BlockProperty;
