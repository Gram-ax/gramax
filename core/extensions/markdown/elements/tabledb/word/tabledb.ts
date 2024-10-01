import { DbTableRenderer } from "@ext/markdown/elements/tabledb/word/DbTableRenderer";
import { TableWithRefs } from "../../../../../logic/components/tableDB/table";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { errorWordLayout } from "@ext/wordExport/error";
import { tableDbString } from "@ext/wordExport/options/wordExportSettings";

export const tabledbWordlayout: WordBlockChild = async ({ tag, wordRenderContext }) => {
	const dbTableRenderer = new DbTableRenderer();

	try {
		const table: TableWithRefs = tag.attributes.object;
		return await Promise.resolve(dbTableRenderer.renderDbTable(table));
	} catch (error) {
		return errorWordLayout(
			tableDbString(wordRenderContext.parserContext.getLanguage()),
			wordRenderContext.parserContext.getLanguage(),
		);
	}
};
