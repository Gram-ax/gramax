import NotionNodeConverter from "@ext/notion/model/NotionNodeConverter";

const bookmark: NotionNodeConverter = (bookmarkNode) => {
	const text = bookmarkNode?.bookmark?.caption?.[0]?.text?.content || " ";
	
	return {
		type: "paragraph",
		content: [
			{
				type: "text",
				plain_text: bookmarkNode.bookmark.url,
				href: bookmarkNode.bookmark.url,
			},
			{ type: "text", plain_text: " " + text },
		],
	};
};

export default bookmark;
