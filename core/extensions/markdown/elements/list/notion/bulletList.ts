import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const listMapping: Record<string, string> = {
	bulleted_list_item: "bulletList",
	numbered_list_item: "orderedList",
};

const list: NotionNodeConverter = (listNode) => {
	const type = listMapping[listNode.type];

	return {
		type: type,
		attrs: { tight: false },
		content: [
			{
				type: "listItem",
				content: [
					{ type: "paragraph", paragraph: { rich_text: listNode[listNode.type].rich_text } },
					...(listNode?.content || []).map((item) => item),
				],
			},
		],
	};
};

export default list;
