import { Token } from "@ext/markdown/core/render/logic/Markdoc";
import MarkdownIt from "markdown-it";

const isImage = (token: Token) => token?.children?.[0]?.type === "image";

export const parseImageSize = (content: string) => {
	const match = content.match(/\{(.*?)\}/);
	if (!match) return null;
	return Object.fromEntries(
		match[1].split(" ").map((param) => {
			const [key, value] = param.split("=");
			return [key, value.replace(/['"]/g, "")];
		}),
	);
};

function imgSizePlugin(md: MarkdownIt) {
	md.core.ruler.push("image-size", function (state) {
		const tokens = state.tokens;
		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];

			if (isImage(token)) {
				const params = parseImageSize(token.content);
				if (!params) continue;
				if (params.width) token.children[0].attrSet("width", params.width);
				if (params.height) token.children[0].attrSet("height", params.height);

				token.content = token.content.replace(/\{.*?\}/, "");
				if (token.children) token.children = token.children.splice(0, 1);
			}
		}
	});
}

export default imgSizePlugin;
