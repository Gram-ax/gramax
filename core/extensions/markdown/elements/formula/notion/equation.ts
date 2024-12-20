import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const equation: NotionNodeConverter = (equationNode) => {
	const tags = [
		{
			$$mdtype: "Tag",
			name: "Formula",
			children: [],
		},
	];

	if (!equationNode?.plain_text)
		return {
			type: "blockMd_component",
			attrs: {
				text: `$$${equationNode[equationNode.type].expression}$$`,
				tag: tags,
			},
			content: [{ type: "text", plain_text: `$$${equationNode[equationNode.type].expression}$$` }],
		};

	return {
		type: "inlineMd_component",
		attrs: {
			text: `$${equationNode.plain_text}$`,
			tag: tags,
		},
	};
};

export default equation;
