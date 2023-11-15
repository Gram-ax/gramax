import { Schema } from "../../../core/render/logic/Markdoc/index";

export const kbd: Schema = {
	render: "Kbd",
	attributes: {
		text: { type: String },
	},
};
