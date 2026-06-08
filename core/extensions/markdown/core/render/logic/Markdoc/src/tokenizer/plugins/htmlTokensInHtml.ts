import type { Token } from "@ext/markdown/core/render/logic/Markdoc";
import type MarkdownIt from "markdown-it";

const processTokensRecursively = (tokens: Token[]) => {
	let fenceToken: Token = null;

	for (let i = 0; i < tokens.length; i++) {
		const token = tokens[i];

		if (token.type === "fence" && token.tag === "code") {
			fenceToken = token;
			continue;
		}

		if (token.type === "tag_close" && token.meta.tag === "html") {
			if (fenceToken) {
				const nextToken = tokens[i + 1];
				const nextIsAlsoHtmlClose = nextToken?.type === "tag_close" && nextToken?.meta?.tag === "html";

				if (nextIsAlsoHtmlClose) {
					fenceToken.content += fenceToken.content.endsWith("\n\n") ? `<${token.info}>` : `\n<${token.info}>`;
					tokens.splice(i, 1);
					i--;
				} else {
					fenceToken = null;
				}
			}

			continue;
		}

		fenceToken = null;

		if (token.children) {
			processTokensRecursively(token.children);
		}
	}
};

function htmlTokensInHtmlPlugin(md: MarkdownIt) {
	md.core.ruler.push("html-tokens-in-html", (state) => {
		processTokensRecursively(state.tokens);
	});
}

export default htmlTokensInHtmlPlugin;
