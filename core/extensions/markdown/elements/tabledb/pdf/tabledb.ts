import type { TableWithRefs } from "@core/components/tableDB/table";
import type { Tag } from "@ext/markdown/core/render/logic/Markdoc";
import { DbTableRenderer } from "@ext/markdown/elements/tabledb/pdf/DbTableRender";

export async function tabledbHandler(node: Tag) {
	const table: TableWithRefs = node.attributes.object;
	const dbTableRenderer = new DbTableRenderer();

	const content = await dbTableRenderer.renderDbTable(table);

	return {
		stack: Array.isArray(content) ? content : [content],
	};
}
