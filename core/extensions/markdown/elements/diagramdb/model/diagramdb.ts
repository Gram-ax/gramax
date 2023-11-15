import Path from "../../../../../logic/FileProvider/Path/Path";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import ParserContext from "../../../core/Parser/ParserContext/ParserContext";
import { Node, Schema, SchemaType, Tag } from "../../../core/render/logic/Markdoc/index";

export function dbDiagram(context: ParserContext): Schema {
	return {
		render: "Db-diagram",
		attributes: {
			path: { type: String },
			tags: { type: String },
			moreTags: { type: String },
		},
		type: SchemaType.block,
		transform: async (node: Node) => {
			const moreTags = node.attributes.moreTags;
			const path = new Path(node.attributes.path);
			const rm = context.getResourceManager();
			const diagramRef = {
				storageId: context.getStorageId(),
				path: rm.getAbsolutePath(path),
			};
			const diagram = await context.getTablesManager().readDiagram(diagramRef);
			const schemaPath = new Path(diagram.schema);
			const tableResourceManager = new ResourceManager(
				rm.rootPath.subDirectory(diagramRef.path.parentDirectoryPath),
				rm.rootPath,
			);
			const absoluteSchemaPath = tableResourceManager.getAbsolutePath(schemaPath);
			const relativeSchemaPath = rm.rootPath.join(rm.basePath).getRelativePath(absoluteSchemaPath);
			rm.set(path);
			rm.set(relativeSchemaPath);

			let primary = "";
			if (moreTags) {
				const prim = /primary=([^,]*)(,|$)/.exec(moreTags);
				if (prim) primary = prim[1] ?? "";
			}

			return new Tag("Db-diagram", {
				src: node.attributes.path,
				tags: node.attributes.tags ?? "",
				primary,
			});
		},
	};
}
