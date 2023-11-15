import { Schema } from "../../../core/render/logic/Markdoc/index";

export const who: Schema = {
	render: "Who",
	attributes: {
		text: { type: String },
	},
};

export const when: Schema = {
	render: "When",
	attributes: {
		text: { type: String },
	},
};
