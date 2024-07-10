import icon from "@ext/markdown/elements/icon/edit/model/iconSchema";
import IconComponent from "@ext/markdown/elements/icon/edit/components/IconComponent";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		icon: {
			setIcon: (attrs: { code?: string; svg?: string; color?: string }) => ReturnType;
		};
	}
}

const Icon = Node.create({
	...getExtensionOptions({ schema: icon, name: "icon" }),

	parseHTML() {
		return [{ tag: "icon-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["icon-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(IconComponent);
	},

	addCommands() {
		return {
			setIcon:
				(attrs) =>
				({ commands }) => {
					return commands.insertContent({ type: this.name, attrs });
				},
		};
	},
});

export default Icon;
