import { Token } from "@ext/markdown/core/render/logic/Markdoc";
import MarkdownIt from "markdown-it";

const isImage = (token: Token) => token.type === "image";

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

const processTokensRecursively = (tokens: Token[]) => {
	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (isImage(token)) {
			const nextToken = tokens?.[i + 1];
			if (!nextToken) continue;

			const params = parseImageSize(nextToken.content);
			if (!params) continue;
			if (params.width) token.attrSet("width", params.width);
			if (params.height) token.attrSet("height", params.height);

			nextToken.content = nextToken.content.replace(/\{.*?\}/, "");
			if (nextToken.children) nextToken.children = nextToken.children.splice(0, 1);
		}

		if (token.children) {
			processTokensRecursively(token.children);
		}
	}
};

function imgSizePlugin(md: MarkdownIt) {
	md.core.ruler.push("image-size", function (state) {
		processTokensRecursively(state.tokens);
	});
}

export default imgSizePlugin;
