import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { createTitleParagraph } from "@ext/wordExport/TextWordGenerator";

export const headingWordLayout: WordBlockChild = async ({ tag }) => {
	const text = tag.children[0];

	if (typeof text === "string")
		return Promise.resolve([createTitleParagraph(text, tag.attributes.level)]);

	return Promise.resolve([]);

};
