import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const taskItem: NotionNodeConverter = (taskNode) => {
	return {
		type: "taskItem",
		attrs: taskNode.attrs,
		content: taskNode.content,
	};
};

export default taskItem;
