import TableRow from "@tiptap/extension-table-row";

const customTableRow = TableRow.extend({
	content: "tableCell*",
});

export default customTableRow;
