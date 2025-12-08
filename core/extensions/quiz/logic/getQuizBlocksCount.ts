import { editName } from "@ext/markdown/elements/question/consts";
import { JSONContent } from "@tiptap/react";

export const getQuizBlocksCount = (node: JSONContent): number => {
	if (node.type === editName) return 1;

	if (node.content) {
		return node.content.reduce((acc, child) => acc + getQuizBlocksCount(child), 0);
	}

	return 0;
};
