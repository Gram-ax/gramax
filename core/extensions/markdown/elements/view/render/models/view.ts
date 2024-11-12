import { Schema, SchemaType } from "@ext/markdown/core/render/logic/Markdoc";
import Tag from "../../../../core/render/logic/Markdoc/src/ast/tag";
import AttributeFormatter from "@ext/markdown/elements/view/render/logic/attributesFormatter";

export const view: Schema = {
	render: "View",
	attributes: {
		defs: { type: String },
		orderby: { type: String },
		groupby: { type: String },
		select: { type: String },
		display: { type: String },
	},
	type: SchemaType.block,
	transform: (node) => {
		const { defs, orderby, groupby, select, display } = new AttributeFormatter().parse(node.attributes);
		return new Tag("View", { defs: defs ?? [], orderby, groupby, select, display });
	},
};
