import { Token } from "@ext/markdown/core/render/logic/Markdoc";

const htmlTransform = (tokens: Token[]) => {
	let idx = 0;
	while (idx < tokens.length) {
		const token = tokens[idx];
		if (token.type === "tag_open" && token.meta.tag === "html") {
			let text = "";
			let nextID = idx + 1;
			const mode = token.meta.attributes?.[0].value || "iframe";

			while (nextID < tokens.length) {
				const nextToken = tokens[nextID];

				if (nextToken.type === "fence") text += nextToken.content.trim();
				else if (nextToken.type === "tag_close" && nextToken.info === "/html") break;
				nextID++;
			}

			(tokens as any).splice(idx, nextID - idx + 1, {
				type: "tag",
				tag: "",
				meta: {
					tag: "html",
					attributes: [
						{ type: "attribute", name: "content", value: text },
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
