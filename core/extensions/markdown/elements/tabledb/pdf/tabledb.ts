import { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { TableWithRefs } from "@core/components/tableDB/table";
import { DbTableRenderer } from "@ext/markdown/elements/tabledb/pdf/DbTableRender";

export function tabledbHandler(node: Tag): any {
	const table: TableWithRefs = node.attributes.object;
	const dbTableRenderer = new DbTableRenderer();

	const content = dbTableRenderer.renderDbTable(table);

	return {
		stack: Array.isArray(content) ? content : [content],
	};
}
