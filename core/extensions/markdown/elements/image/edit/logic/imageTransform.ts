import { Token } from "@ext/markdown/core/render/logic/Markdoc";

const imageTransform = (tokens: Token[]) => {
	for (let idx = 0; idx < tokens.length; idx++) {
		const token = tokens[idx];
		if (token.type === "inline" && token?.tag === "" && token?.children?.[0]?.tag == "img") {
			const imgToken = token.children[0];
			const attrs = imgToken.attrs.filter((attr) => attr[0] !== "alt");
			tokens.splice(idx - 1, 3, { type: "image", attrs: [...attrs, ["alt", imgToken.content]] } as any);
		}
	}
	return tokens;
};

export default imageTransform;
