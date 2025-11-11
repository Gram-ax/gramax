import { Config, Node, Schema, SchemaType, Tag } from "@ext/markdown/core/render/logic/Markdoc";

export function questionAnswer(): Schema {
	return {
		render: "QuestionAnswer",
		selfClosing: false,
		attributes: {
			type: { type: String },
			questionId: { type: String },
			answerId: { type: String },
		},
		type: SchemaType.block,
		transform: async (node: Node, config: Config) => {
			return new Tag(
				"QuestionAnswer",
				{
					type: node.attributes.type,
					answerId: node.attributes.answerId,
				},
				await node.transformChildren(config),
			);
		},
	};
}
