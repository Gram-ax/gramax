import { DbTableRenderer } from "@ext/markdown/elements/tabledb/word/DbTableRenderer";
import { TableWithRefs } from "../../../../../logic/components/tableDB/table";
import { WordBlockChild } from "../../../../wordExport/options/WordTypes";
import { Paragraph } from "docx";
import { errorWordLayout } from "@ext/wordExport/error";
import { tableDbString } from "@ext/wordExport/options/wordExportSettings";

export const tabledbWordlayout: WordBlockChild = async ({ tag, parserContext }) => {
	try {
		const table: TableWithRefs = tag.attributes.object;
		return await Promise.all([
			...DbTableRenderer.renderDbTable(table),
			...Object.values(table.refs)
				.filter((val) => val)
				.map((ref) => [new Paragraph(""), DbTableRenderer.renderDbTable(ref)])
				.flat(2),
		]);
	} catch (error) {
		return errorWordLayout(tableDbString(parserContext.getLanguage()), parserContext.getLanguage());
	}
};
