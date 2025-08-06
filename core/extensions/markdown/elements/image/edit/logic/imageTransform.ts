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

		if (isInline || hasText) {
			parent.children[i] = {
				type: "inlineImage",
				attrs: Object.fromEntries([...attrs, ["alt", childToken?.content ?? ""]]) as any,
			} as any;

			continue;
		}

		tokens.splice(idx - 1, 3, {
			type: "image",
			attrs: [...attrs, ["alt", childToken?.content ?? ""]],
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
