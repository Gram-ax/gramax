import lowlight, { loadLanguage } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import { normalizeLangName } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";
import type { CodeRenderer } from "@gramax/openapi-viewer";

/**
 * Code samples inside an OpenAPI block are code, and Gramax already highlights code — this hands the viewer
 * that highlighter instead of letting it carry a second one. A cURL sample then reads the same way whether it
 * sits in an article's fenced block or in a spec's `x-codeSamples`.
 *
 * Only the token spans are produced, without highlight.js's own `.hljs` wrapper: the viewer's `<pre>` already
 * owns the block's surface, padding and font, and `[data-theme] .hljs-*` in `core/styles/code-block.css`
 * colors the tokens inside it — in both themes, since the viewer renders under the app's `[data-theme]`.
 */

type HastNode = {
	type: string;
	value?: string;
	tagName?: string;
	properties?: { className?: string[] };
	children?: HastNode[];
};

const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
const esc = (value: string): string => value.replace(/[&<>"]/g, (char) => ENTITIES[char]);

/**
 * Serializing a hast tree in general is a whole dependency family, but what lowlight produces is narrow: a
 * root, nested `<span>`s carrying class names, and text. This walks that shape and nothing else — anything
 * unexpected contributes its text and no markup, which is the safe direction to fail in.
 */
const toHtml = (node: HastNode): string => {
	if (node.type === "text") return esc(node.value ?? "");
	const inner = (node.children ?? []).map(toHtml).join("");
	if (node.type !== "element") return inner;
	// Deliberately not keyed on `tagName`: lowlight builds its token elements without one, so requiring "span"
	// dropped every token and samples came out as plain text. What identifies a token here is the class list,
	// and a token is the only thing this walker emits markup for -- anything else still contributes text only.
	const classes = node.properties?.className ?? [];
	return classes.length ? `<span class="${esc(classes.join(" "))}">${inner}</span>` : inner;
};

/** Grammars are lazy modules. A sample whose language is not loaded yet is asked for once, never in a loop. */
const requested = new Set<string>();

const rerenderOpenApiBlocks = (): void => {
	for (const doc of document.querySelectorAll("openapi-doc")) {
		(doc as HTMLElement & { render?: () => void }).render?.();
	}
};

const renderOpenApiCode: CodeRenderer = (source, { lang }) => {
	// `lang` is whatever vocabulary the spec author used — "Shell", "PHP", "Python (requests)" is a label, not
	// a language. normalizeLangName maps the ones that name a grammar; anything else falls through to plain text.
	const name = normalizeLangName(lang);
	if (name && !lowlight.registered(name) && !requested.has(name)) {
		requested.add(name);
		void loadLanguage(name).then((loaded) => {
			// The first render of a sample is plain text while its grammar loads; re-render once it is here.
			if (loaded) rerenderOpenApiBlocks();
		});
	}
	return toHtml(lowlight.highlight(name && lowlight.registered(name) ? name : "none", source) as HastNode);
};

export default renderOpenApiCode;
