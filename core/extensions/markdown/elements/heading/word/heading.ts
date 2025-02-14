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
	const headingParagraph = new Paragraph({
		children: [
			new BookmarkStart(bookmarkName, bookmarkId),
			...(await state.renderInline(tag, addOptions)),
			new BookmarkEnd(bookmarkId),
		],
		style:
			wordRenderContext.exportType === ExportType.withTableOfContents
				? HeadingStyles[tag.attributes.level]
				: HStyles[tag.attributes.level],
	});

	return [headingParagraph];
};
