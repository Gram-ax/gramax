import { Paragraph } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { HeadingStyles } from "@ext/wordExport/options/wordExportSettings";

export const headingWordLayout: WordBlockChild = async ({ state, tag, addOptions }) => {
	return [
		new Paragraph({
			children: await state.renderInline(tag, addOptions),
			style: HeadingStyles[tag.attributes.level],
		}),
	];
};
