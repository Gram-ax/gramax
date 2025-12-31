import { Config, Node, Schema, SchemaType, Tag } from "@ext/markdown/core/render/logic/Markdoc";

export function questionAnswer(): Schema {
	return {
		render: "QuestionAnswer",
		selfClosing: false,
		attributes: {
			questionId: { type: String },
			correct: { type: Boolean },
			type: { type: String },
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
