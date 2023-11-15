import { Schema } from "../../../../../core/render/logic/Markdoc";

export const answer: Schema = {
	render: "Answer",
	attributes: {
		mail: { type: String },
		dateTime: { type: String },
	},
	selfClosing: false,
	transform: () => null,
};
