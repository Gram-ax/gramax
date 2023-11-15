import { Schema, SchemaType } from "../../../../core/render/logic/Markdoc/index";

export const note: Schema = {
	render: "Note",
	attributes: {
		type: { type: String },
		title: { type: String },
	},
	selfClosing: false,
	type: SchemaType.block,
};
