import type MarkdownIt from "markdown-it/lib";

export default function plugin(md: MarkdownIt) {
	md.normalizeLinkText = function (text) {
		return text;
	};
}
