import { Schema } from "../../../core/render/logic/Markdoc";

export const comment: Schema = {
	render: "Comment",
	selfClosing: false,
	attributes: {
		count: { type: String },
	},
	transform: (node, config) => {
		return node.transformChildren(config);
	},
};
