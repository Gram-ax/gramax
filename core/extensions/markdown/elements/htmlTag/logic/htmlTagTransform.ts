import { Token } from "@ext/markdown/core/render/logic/Markdoc";

const htmlTagTransform = (tokens: Token[]) => {
	const result = [];

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		const resultStartIndex = result.length;
		if (
			token.type === "inline" &&
			token.children?.some(
				(child) => child.meta?.tag === "blockHtmlTag" || child.meta?.tag === "blockWithInlineHtmlTag",
			)
		) {
			const paragraphOpen = tokens[i - 1];
			const paragraphClose = tokens[i + 1];

			let chunk = [];

			const flushChunkAsParagraph = (addParagraph?: boolean) => {
				if (!chunk.length) return;
				addParagraph && result.push({ ...paragraphOpen });
				result.push({
					...token,
					children: [...chunk],
					content: chunk.map((t) => t.content).join(""),
				});
				addParagraph && result.push({ ...paragraphClose });
				chunk = [];
			};

			for (let j = 0, deps = 0; j < token.children.length; j++) {
				const child = token.children[j];
				const tagType = child.meta?.tag;

				if (tagType === "blockHtmlTag") {
					flushChunkAsParagraph(true);
					result.push(child);

					if (child.children && child.children.length) {
						result.push({
							...token,
							type: "inline",
							children: [...child.children],
							content: child.children.map((t) => t.content).join(""),
						});
					}
				} else if (tagType === "blockWithInlineHtmlTag") {
					flushChunkAsParagraph(!deps);

					if (child.type == "tag_open") deps++;
					if (child.type == "tag_close") deps--;

					result.push(child);

					if (child.children && child.children.length) {
						result.push({
							...token,
							type: "inline",
							children: [...child.children],
							content: child.children.map((t) => t.content).join(""),
						});
					}
				} else {
					chunk.push(child);
				}
			}

			flushChunkAsParagraph(true);
			result.splice(resultStartIndex - 1, 1);
			i += 1;
		} else {
			result.push(token);
		}
	}

	return result as Token[];
};

export default htmlTagTransform;
