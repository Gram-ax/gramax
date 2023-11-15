import { Bookmark, Paragraph } from "docx";
import { WordBlockChild } from "../../../../wordExport/WordTypes";

export const paragraphWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return [
		new Paragraph({
			children: [
				...(tag.attributes.id ? [new Bookmark({ id: tag.attributes.id, children: [] })] : []),
				...(await state.renderInline(tag, addOptions)),
			],
			...addOptions,
		}),
	];
};
