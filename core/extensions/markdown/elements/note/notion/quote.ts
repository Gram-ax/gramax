import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const quote: NotionNodeConverter = (quoteNode) => {
	return {
		type: "note",
		attrs: { title: null, type: "quote", collapsed: false },
		content: [{ type: "paragraph", paragraph: { rich_text: quoteNode[quoteNode.type].rich_text } }],
	};
};

export default quote;
