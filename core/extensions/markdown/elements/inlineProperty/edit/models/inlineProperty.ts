import InlinePropertyComponent from "@ext/markdown/elements/inlineProperty/edit/components/InlinePropertyComponent";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import inlinePropertySchema from "@ext/markdown/elements/inlineProperty/edit/models/inlinePropertySchema";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		"inline-property": { setInlineProperty: (attributes?: { bind?: string }) => ReturnType };
	}
}

interface InlinePropertyOptions {
	canChangeProps: boolean;
}

const InlineProperty = Node.create<InlinePropertyOptions>({
	...getExtensionOptions({ schema: inlinePropertySchema, name: "inline-property" }),

	addOptions() {
		return {
			canChangeProps: false,
		};
	},

	parseHTML() {
		return [{ tag: "inline-property" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["inline-property", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(InlinePropertyComponent);
	},

	addCommands() {
		return {
			setInlineProperty:
				(attributes) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: attributes,
					});
				},
		};
	},
});

export default InlineProperty;
