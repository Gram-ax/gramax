import { Paragraph } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { HStyles, HeadingStyles } from "@ext/wordExport/options/wordExportSettings";
import { ExportType } from "@ext/wordExport/ExportType";

export const headingWordLayout: WordBlockChild = async ({ state, tag, addOptions, exportType }) => {
	return [
		new Paragraph({
			children: await state.renderInline(tag, addOptions),
			style:
				exportType === ExportType.withTableOfContents
					? HeadingStyles[tag.attributes.level]
					: HStyles[tag.attributes.level],
		}),
	];
};
