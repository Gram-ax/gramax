import { Schema } from "../../../core/render/logic/Markdoc/index";

export const see: Schema = {
	render: "See",
	attributes: {
		link: { type: String },
		name: { type: String },
		lang: { type: String },
	},
};
