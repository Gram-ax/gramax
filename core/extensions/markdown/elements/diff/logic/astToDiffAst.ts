import { JSONContent } from "@tiptap/core";

export type DiffDocWithPaths = { diffDoc: JSONContent; paths: string[] };

export default function astToDiffAst(ast: JSONContent): DiffDocWithPaths {
	const result: JSONContent[] = [];
	const paths: string[] = [];

	// подумать над depth
	const traverse = (node: JSONContent, depth: number, path: string) => {
		if (node.type === "text") return;
		const haveTextContent = node.type === "paragraph" || node.type === "heading" || node.type === "code_block";
		const diffNode: JSONContent = {
			...node,
			type: "diff_item",
			attrs: {
				diff_attrs: JSON.stringify(node.attrs),
				diff_node_type: node.type,
			},
			content: haveTextContent
				? node.content
				: [
						{
							type: "text",
							text: " ",
						},
				  ],
		};

		result.push(diffNode);
		paths.push(path);

		if (node.content && Array.isArray(node.content)) {
			node.content.forEach((child, idx) => {
				traverse(child, depth + 1, path + "/" + idx);
			});
		}
	};

	ast.content.forEach((child, idx) => {
		traverse(child, 0, idx.toString());
	});

	return { diffDoc: { type: "doc", content: result }, paths };
}
