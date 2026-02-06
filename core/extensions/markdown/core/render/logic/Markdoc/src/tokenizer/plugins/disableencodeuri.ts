import type MarkdownIt from "markdown-it/lib";

export default function plugin(md: MarkdownIt) {
	md.normalizeLink = (url) => {
		return url;
	};
	md.normalizeLinkText = (text) => text;
}
