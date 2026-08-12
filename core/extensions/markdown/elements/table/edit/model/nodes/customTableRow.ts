import getExtensionOptions from "@ext/markdown/logic/getExtensionOptions";
import { TableRow } from "@tiptap/extension-table";
import { tableRow } from "../tableSchema";

const CustomTableRow = TableRow.extend({
	...getExtensionOptions({ schema: tableRow, name: TableRow.name }),
});

export default CustomTableRow;
