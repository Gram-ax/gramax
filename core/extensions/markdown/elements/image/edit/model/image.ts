import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import EditImage from "../components/ImageComponent";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		image: { setImage: (options: { src: string; alt?: string; title?: string }) => ReturnType };
	}
}

const Image = Node.create({
	name: "image",
	group: "block",

	addAttributes() {
		return { src: { default: null }, alt: { default: null }, title: { default: null } };
	},

	parseHTML() {
		return [{ tag: "image-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["image-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(EditImage);
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
