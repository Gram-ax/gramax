import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const gramaxParagraph: NotionNodeConverter = (paragraphNode) => {
	return {
		type: "paragraph",
		content: paragraphNode.content,
	};
};

export default gramaxParagraph;
