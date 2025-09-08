export function escapeLinkForPatcher(url: string): string {
	return url.replace(/&(?!amp;)/g, "&amp;");
}
