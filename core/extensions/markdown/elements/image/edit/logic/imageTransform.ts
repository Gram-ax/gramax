import { Token } from "@ext/markdown/core/render/logic/Markdoc";
import { MAX_INLINE_IMAGE_HEIGHT } from "@ext/markdown/elements/inlineImage/edit/models/node";

const imageTransform = (tokens: Token[]) => {
	for (let idx = 0; idx < tokens.length; idx++) {
		const token = tokens[idx];
		if (token.type === "inline" && token?.tag === "" && token?.children?.[0]?.tag == "img") {
			const imgToken = token.children[0];
			const attrs = imgToken.attrs.filter((attr) => attr[0] !== "alt");

			let isInline = false;
			const heightAttr = attrs.find((attr) => attr[0] === "height");
			if (heightAttr) {
				const height = parseFloat(heightAttr[1]);
				isInline = height <= MAX_INLINE_IMAGE_HEIGHT;
			}

			tokens.splice(idx - 1, 3, {
				type: isInline ? "inlineImage" : "image",
				attrs: [...attrs, ["alt", imgToken.content]],
			} as any);
		}
	}
	return tokens;
};

export default imageTransform;
