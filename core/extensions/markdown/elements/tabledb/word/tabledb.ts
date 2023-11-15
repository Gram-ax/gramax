import { Paragraph } from "docx";
import { TableWithRefs } from "../../../../../logic/components/tableDB/table";
import { WordBlockChild } from "../../../../wordExport/WordTypes";
import { TableDbRenderer } from "./TableDbRenderer";

export const tabledbWordlayout: WordBlockChild = async ({ tag }) => {
	const table: TableWithRefs = tag.attributes.object;
	return await Promise.all([
		...TableDbRenderer.renderDbTable(table),
		...Object.values(table.refs)
			.filter((val) => val)
			.map((ref) => [new Paragraph(""), TableDbRenderer.renderDbTable(ref)])
			.flat(2),
	]);
};
