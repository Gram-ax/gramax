import Token from "markdown-it/lib/token";

const blockCommentTransformer = (tokens: Token[]) => {
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];
		if (token.type === "tag_open" && token.meta.tag === "comment") {
			const commentId = token.meta.attributes.find((attr) => attr.name === "id")?.value;
			const tagEndToken = tokens?.[i + 2] as any;
			if (!commentId || !tagEndToken || tagEndToken.type !== "tag_close") continue;

			const nextToken = tokens?.[i + 1] as any;
			if (!nextToken) continue;

			if (!(nextToken instanceof Token)) {
				if (!nextToken.attrs) nextToken.attrs = [];
				nextToken.attrs.push(["comment", { id: commentId } as any]);
				tokens.splice(i, 3, nextToken);

				if (nextToken.meta?.attributes) {
					nextToken.meta.attributes.push({
						type: "attribute",
						name: "comment",
						value: { id: commentId },
					});
				}

				continue;
			}

			if (!nextToken.meta.attributes) nextToken.meta.attributes = [];
			nextToken.meta.attributes.push({
				type: "attribute",
				name: "comment",
				value: { id: commentId },
			});
			tokens.splice(i, 3, nextToken);
		}
	}

	return tokens;
};

export default blockCommentTransformer;
