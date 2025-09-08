import { Token } from "@ext/markdown/core/render/logic/Markdoc";
import { MAX_INLINE_IMAGE_HEIGHT } from "@ext/markdown/elements/inlineImage/edit/models/node";

const processImage = (parent: Token, tokens: Token[], idx: number, hasText: boolean) => {
	for (let i = 0; i < parent.children.length; i++) {
		const childToken = parent.children[i];
		if (childToken.tag !== "img") continue;
		const attrs = childToken?.attrs?.filter((attr) => attr[0] !== "alt");

		let isInline = false;
		const heightAttr = attrs?.find((attr) => attr[0] === "height");
		if (heightAttr) {
			const height = parseFloat(heightAttr[1]);
			isInline = height <= MAX_INLINE_IMAGE_HEIGHT;
		}

		const prevToken = parent.children?.[i - 1] as any;
		const commentId =
			prevToken?.meta?.tag === "comment"
				? prevToken.meta.attributes.find((attr) => attr.name === "id")?.value
				: null;

		if (isInline || hasText) {
			const from = commentId ? i - 1 : i;
			const to = commentId ? 3 : 1;
			parent.children.splice(from, to, {
				type: "inlineImage",
				attrs: Object.fromEntries([
					...attrs,
					["alt", childToken?.content ?? ""],
					["comment", { id: commentId }],
				]),
			} as any);

			continue;
		}

		tokens.splice(idx - 1, 3, {
			type: "image",
			attrs: [...attrs, ["alt", childToken?.content ?? ""], ["comment", { id: commentId }]],
		} as any);
	}
};

const imageTransform = (tokens: Token[]) => {
	for (let idx = 0; idx < tokens.length; idx++) {
		const token = tokens[idx];
		if (token.type === "inline" && token?.tag === "" && token?.children?.length > 0) {
			const hasText = token.children.some(
				(childToken) => childToken.type === "text" && childToken.content.length > 0,
			);

			processImage(token, tokens, idx, hasText);
		}
	}

	return tokens;
};

export default imageTransform;
