import imageSchema from "@ext/markdown/elements/image/edit/model/imageSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageComponent from "../components/ImageComponent";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		image: { setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType };
	}
}

const Image = Node.create({
	...getExtensionOptions({ schema: imageSchema, name: "image", withResource: true }),
	draggable: true,
	group: "block",
	inline: false,

	parseHTML() {
		return [{ tag: "image-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["image-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(ImageComponent);
	},

	addCommands() {
		return {
			setImage:
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

export default Image;
