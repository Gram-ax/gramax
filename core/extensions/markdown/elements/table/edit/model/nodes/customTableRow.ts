import TableRow from "@tiptap/extension-table-row";

const CustomTableRow = TableRow.extend({
	content: "tableCell*",
});

export default CustomTableRow;
