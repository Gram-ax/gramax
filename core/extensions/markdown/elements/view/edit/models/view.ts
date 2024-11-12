import ViewComponent from "@ext/markdown/elements/view/edit/components/ViewComponent";
import viewSchema from "@ext/markdown/elements/view/edit/models/viewSchema";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { PropertyValue } from "@ext/properties/models";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		view: {
			setView: (attrs: { defs: PropertyValue[]; orderby?: []; groupby?: [] }) => ReturnType;
		};
	}
}

const view = Node.create({
	...getExtensionOptions({ schema: viewSchema, name: "view" }),

	parseHTML() {
		return [{ tag: "view-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["view-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(ViewComponent);
	},

	addCommands() {
		return {
			setView:
				(attrs) =>
				({ commands }) => {
					return commands.insertContent({ type: this.name, attrs });
				},
		};
	},
});

export default view;
