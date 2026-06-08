import { getNewColorFromOld } from "@ext/markdown/elements/highlight/edit/logic/getNewColorFromOld";
import { type Schema, Tag } from "../../../../core/render/logic/Markdoc";

export const highlight: Schema = {
	render: "Highlight",
	attributes: {
		color: { type: String },
	},
	selfClosing: false,
	transform: async (node, config) => {
		const { color } = node.attributes;

		return new Tag(
			"Highlight",
			{
				...node.attributes,
				color: getNewColorFromOld(color) ?? color,
			},
			await node.transformChildren(config),
		);
	},
};
