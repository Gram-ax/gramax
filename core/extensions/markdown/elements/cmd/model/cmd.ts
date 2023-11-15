import { Schema } from "../../../core/render/logic/Markdoc/index";

export const cmd: Schema = {
	render: "Cmd",
	attributes: {
		text: { type: String },
		icon: { type: String },
		color: { type: String },
	},
};
