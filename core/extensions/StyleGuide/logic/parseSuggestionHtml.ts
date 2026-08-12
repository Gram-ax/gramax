export interface SuggestionSegmentAttrs {
	name: string;
	description: string;
	text: string;
}

export interface SuggestionSegment {
	text: string;
	attrs?: SuggestionSegmentAttrs;
}

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

const parseSuggestionHtml = (html: string): SuggestionSegment[] => {
	const body = new DOMParser().parseFromString(html, "text/html").body;
	const segments: SuggestionSegment[] = [];

	const push = (text: string, attrs?: SuggestionSegmentAttrs) => {
		if (!text) return;
		const last = segments[segments.length - 1];
		if (!attrs && last && !last.attrs) last.text += text;
		else segments.push(attrs ? { text, attrs } : { text });
	};

	const traverse = (node: ChildNode) => {
		if (node.nodeType === TEXT_NODE) return push(node.textContent);
		if (node.nodeType !== ELEMENT_NODE) return;

		const element = node as HTMLElement;
		if (element.tagName === "SUGGESTION") {
			return push(element.textContent, {
				name: element.getAttribute("name"),
				description: element.getAttribute("description"),
				text: element.getAttribute("text"),
			});
		}

		element.childNodes.forEach(traverse);
	};

	body.childNodes.forEach(traverse);
	return segments;
};

export default parseSuggestionHtml;
