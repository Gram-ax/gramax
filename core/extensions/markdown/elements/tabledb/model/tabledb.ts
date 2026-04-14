import Path from "../../../../../logic/FileProvider/Path/Path";
import type PrivateParserContext from "../../../core/Parser/ParserContext/PrivateParserContext";
import { type Node, type Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";

export function tabledb(context: PrivateParserContext): Schema {
	return {
		render: "Db-table",
		attributes: {
			name: { type: String },
			path: { type: String },
		},
		type: SchemaType.block,
		transform: async (node: Node) => {
			const relativePath = new Path(node.attributes.path);
			const lm = context.getLinkManager();
			lm.set(relativePath);
			const tablePath = lm.getAbsolutePath(relativePath);
			const { storageId, path, name } = {
				storageId: context.getStorageId(),
				path: tablePath,
				name: node.attributes.name,
			};
			let attributes = {};

			try {
				const object = await context.getTablesManager().getTableWithRefs(
					{
						storageId,
						path,
					},
					name,
				);
				attributes = { object };
			} catch (e) {
				attributes = {
					error: { message: e.message, stack: e.stack },
				};
			}
			return new Tag("Db-table", attributes, []);
		},
	};
}
