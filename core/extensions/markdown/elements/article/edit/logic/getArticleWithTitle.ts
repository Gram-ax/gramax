import type { JSONContent } from "@tiptap/core";

const getArticleWithTitle = (title: string, editTree: JSONContent) => {
	return {
		type: "doc",
		content: [
			{
				type: "paragraph",
				content: title ? [{ type: "text", text: title }] : [],
			},
			...editTree.content,
		],
	};
};

export default getArticleWithTitle;
