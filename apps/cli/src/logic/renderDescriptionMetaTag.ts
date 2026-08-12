const escapeHtmlAttribute = (value: string) =>
	value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export default function renderDescriptionMetaTag(description?: string) {
	if (!description) return "";
	return `<meta name="description" content="${escapeHtmlAttribute(description)}">`;
}
