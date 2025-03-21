import { Paragraph, BookmarkStart, BookmarkEnd } from "docx";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { HStyles, HeadingStyles } from "@ext/wordExport/options/wordExportSettings";
import { ExportType } from "@ext/wordExport/ExportType";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";

export const headingWordLayout: WordBlockChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const bookmarkId = 1;
	const bookmarkName = generateBookmarkName(
		wordRenderContext.order,
		wordRenderContext.articleName,
		tag.attributes.id,
	);

	const addOptionsWithStyle = { ...(addOptions ?? {}) };
	if (tag.attributes.level >= 5) addOptionsWithStyle.style = HStyles[tag.attributes.level];

	const headingParagraph = new Paragraph({
		children: [
			new BookmarkStart(bookmarkName, bookmarkId),
			...(await state.renderInline(tag, addOptionsWithStyle)),
			new BookmarkEnd(bookmarkId),
		],
		style:
			wordRenderContext.exportType === ExportType.withTableOfContents
				? HeadingStyles[tag.attributes.level]
				: HStyles[tag.attributes.level],
	});

	return [headingParagraph];
};
