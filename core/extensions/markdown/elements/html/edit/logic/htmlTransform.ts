import type { PreTransformerFunc } from "@ext/markdown/core/Parser/Transformer/preTransformTokens";

const htmlTransform: PreTransformerFunc = ({ tokens }) => {
	let idx = 0;
	while (idx < tokens.length) {
		const token = tokens[idx];
		if (token.type === "tag_open" && token.meta.tag === "html") {
			let text = "";
			let nextID = idx + 1;
			const attributes = (token.meta.attributes ?? []).filter(({ name }) => name !== "content");
			const mode = attributes.find(({ name }) => name === "mode")?.value || "iframe";

			while (nextID < tokens.length) {
				const nextToken = tokens[nextID];

				if (nextToken.type === "fence") text += nextToken.content.trim();
				else if (nextToken.type === "tag_close" && nextToken.info === "/html") break;
				nextID++;
			}

			// biome-ignore lint/suspicious/noExplicitAny: expected
			(tokens as any).splice(idx, nextID - idx + 1, {
				type: "tag",
				tag: "",
				meta: {
					tag: "html",
					attributes: [
						{ type: "attribute", name: "content", value: text },
						...attributes.filter(({ name }) => name !== "mode"),
						{ type: "attribute", name: "mode", value: mode },
					],
				},
			});
		}

		idx++;
	}
	return tokens;
};

export default htmlTransform;
