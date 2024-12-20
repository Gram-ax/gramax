import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const taskList: NotionNodeConverter = (taskListNode) => {
	return {
		type: "taskList",
		content: [
			{
				type: "taskItem",
				attrs: { checked: taskListNode[taskListNode.type].checked },
				content: [
					{ type: "paragraph", paragraph: { rich_text: taskListNode[taskListNode.type].rich_text } },
					...(taskListNode?.content || []).map((item) => item),
				],
			},
		],
	};
};

export default taskList;
