import { Node, RenderableTreeNodes, Schema, SchemaType, Tag } from "../../../../core/render/logic/Markdoc/index";
import getDiagramTagByFence from "../../../diagrams/logic/getDiagramTag";
import isDiagramName from "../../../diagrams/logic/isDiagramName";

export const fence: Schema = {
	render: "Fence",
	attributes: {
		language: { type: String },
		value: { type: String },
	},
	type: SchemaType.block,
	transform: (node: Node): RenderableTreeNodes => {
		const lang = node.attributes.language;
		const content = node.attributes.content;
		if (isDiagramName(lang)) return getDiagramTagByFence(lang, content);
		return new Tag("Fence", { lang: lang, value: content });
	},
};
