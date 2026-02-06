import docx from "@dynamicImports/docx";
import { ExportType } from "@ext/wordExport/ExportType";
import { generateBookmarkName } from "@ext/wordExport/generateBookmarkName";
import { getHeadingStyles, HStyles } from "@ext/wordExport/options/wordExportSettings";
import type { WordBlockChild } from "../../../../wordExport/options/WordTypes";

export const headingWordLayout: WordBlockChild = async ({ state, tag, addOptions, wordRenderContext }) => {
	const { Paragraph, BookmarkStart, BookmarkEnd } = await docx();
	const headingStyles = await getHeadingStyles();
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
				? headingStyles[tag.attributes.level]
				: HStyles[tag.attributes.level],
	});

	return [headingParagraph];
};
