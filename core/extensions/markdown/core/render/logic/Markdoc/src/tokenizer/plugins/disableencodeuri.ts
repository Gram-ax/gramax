import type MarkdownIt from "markdown-it/lib";

export default function plugin(md: MarkdownIt) {
	const originalNormalizeLink = md.normalizeLink;

	md.normalizeLink = function (url: string): string {
		return decodeURIComponent(originalNormalizeLink(url));
	};
}
