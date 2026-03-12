import { editName } from "@ext/markdown/elements/question/consts";
import type { JSONContent } from "@tiptap/react";

export const isQuizArticle = (node: JSONContent): boolean => {
	if (node.type === editName) {
		return true;
	}

	if (node.content) {
		return node.content.some(isQuizArticle);
	}

	return false;
};

export const getQuizBlocksCount = (node: JSONContent): number => {
	if (node.type === editName) {
		const isNull = node.content[node.content.length - 1].attrs.correct === null;
		return isNull ? 0 : 1;
	}

	if (node.content) {
		return node.content.reduce((acc, child) => acc + getQuizBlocksCount(child), 0);
	}

	return 0;
};
