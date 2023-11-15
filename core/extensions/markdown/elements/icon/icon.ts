import { Schema } from "../../core/render/logic/Markdoc/index";

export const icon: Schema = {
	render: "Icon",
	attributes: {
		code: { type: String },
		prefix: { type: String },
		color: { type: String },
	},
};
