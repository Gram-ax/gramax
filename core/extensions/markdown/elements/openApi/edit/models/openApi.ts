import openapi from "@ext/markdown/elements/openApi/edit/models/openApiSchema";
import OPEN_API_NAME from "@ext/markdown/elements/openApi/name";
import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { mergeAttributes, Node } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import OpenApiComponent from "../components/OpenApiComponent";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		openApi: {
			setOpenApi: (options: { src?: string }) => ReturnType;
		};
	}
}

const OpenApi = Node.create({
	...getExtensionOptions({ schema: openapi, name: OPEN_API_NAME, withResource: true }),

	parseHTML() {
		return [{ tag: "openapi-react-component" }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["openapi-react-component", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(OpenApiComponent);
	},

	addCommands() {
		return {
			setOpenApi:
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

export default OpenApi;
