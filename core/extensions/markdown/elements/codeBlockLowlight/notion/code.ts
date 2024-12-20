import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const code: NotionNodeConverter = (codeNode) => {
	return {
		type: "code_block",
		attrs: {
			language: codeNode?.code?.language,
		},
		content: codeNode.code.rich_text,
	};
};

export default code;
