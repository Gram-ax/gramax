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
			const lm = context.getResourceManager();
			const diagramRef = {
				storageId: context.getStorageId(),
				path: lm.getAbsolutePath(path),
			};
			const diagram = await context.getTablesManager().readDiagram(diagramRef);
			if (!diagram)
				return new Tag("Db-diagram", {
					src: null,
					tags: "",
				});

			const schemaPath = new Path(diagram.schema);
			const tableResourceManager = new ResourceManager(
				context.fp,
				lm.rootPath.subDirectory(diagramRef.path.parentDirectoryPath),
				lm.rootPath,
			);
			const absoluteSchemaPath = tableResourceManager.getAbsolutePath(schemaPath);
			const relativeSchemaPath = lm.rootPath.join(lm.basePath).getRelativePath(absoluteSchemaPath);
			lm.set(path);
			lm.set(relativeSchemaPath);

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
