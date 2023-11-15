import { JSONContent } from "@tiptap/core";

class JSONTransformer {
	static transform(
		node: JSONContent,
		transformers: ((node: JSONContent, previousNode?: JSONContent) => JSONContent | JSONContent[])[],
	): JSONContent {
		const transform = (node: JSONContent, previousNode?: JSONContent): JSONContent => {
			if (node?.content)
				node.content = node.content
					.map((n, i) => transform(n, i == 0 ? null : node.content[i - 1]))
					.flat()
					.filter((n) => n);

			for (const transformer of transformers) {
				const newNode = transformer(node, previousNode);
				if (JSON.stringify(newNode) !== JSON.stringify(node)) return newNode;
			}

			return node;
		};

		return transform(node);
	}
}

export default JSONTransformer;
