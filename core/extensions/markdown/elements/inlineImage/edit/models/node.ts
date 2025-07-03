import InlineImageComponent from "@ext/markdown/elements/inlineImage/edit/components/InlineImageComponent";
import inlineImageSchema from "@ext/markdown/elements/inlineImage/edit/models/schema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

export const MAX_INLINE_IMAGE_HEIGHT = 48;

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		inlineImage: { setInlineImage: (options: { src: string; alt?: string; title?: string }) => ReturnType };
	}
}

const InlineImage = Node.create({
	...getExtensionOptions({ schema: inlineImageSchema, name: "inlineImage", withResource: true }),

	parseHTML() {
		return [{ tag: "inline-image-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["inline-image-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(InlineImageComponent);
	},

	addCommands() {
		return {
			setInlineImage:
				(options) =>
				({ commands }) => {
					return commands.insertContent({
						type: this.name,
						attrs: options,
					});
				},
		};
	},
});

export default InlineImage;
