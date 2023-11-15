import { Schema, Tag } from "@ext/markdown/core/render/logic/Markdoc";

export const code: Schema = {
	render: "Code",
	attributes: {
		content: { type: String },
	},
	transform: (node) => new Tag("Code", {}, [node.attributes.content]),
};
