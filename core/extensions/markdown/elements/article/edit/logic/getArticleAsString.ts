import { JSONContent } from "@tiptap/core/dist/packages/core/src/types";

const getArticleAsString = (title: string, editTree: JSONContent) => {
	return JSON.stringify({
		type: "doc",
		content: [
			{
				type: "heading",
				attrs: { id: "article-title", level: 1, isCustomId: true },
				content: title ? [{ type: "text", text: title }] : [],
			},
			...editTree.content,
		],
	});
};

export default getArticleAsString;