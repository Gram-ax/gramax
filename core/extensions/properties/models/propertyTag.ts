import type { Schema } from "@ext/markdown/core/render/logic/Markdoc";

export const propertyTag: Schema = {
	render: "property",
	attributes: {
		id: { type: String },
		value: { type: String },
	},
};
