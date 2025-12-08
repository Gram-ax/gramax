import { checkLanguage, loadLanguage, lowlight } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/Lowlight";
import { normalizeLangName } from "@ext/markdown/elements/codeBlockLowlight/edit/logic/LowlightLangs";

type HastText = { type: "text"; value: string };
type HastElement = { type: "element"; properties?: { className?: string[] }; children: HastNode[] };
type HastNode = HastText | HastElement;

type Token = { text: string; classes: string[] };

// Palette matches light theme in core/styles/code-block.css
export const CLASS_COLOR_MAP: Record<string, string> = {
	"hljs-comment": "656e77",
	"hljs-quote": "b75501",
	"hljs-keyword": "015692",
	"hljs-selector-tag": "015692",
	"hljs-meta-keyword": "015692",
	"hljs-doctag": "015692",
	"hljs-section": "015692",
	"hljs-selector-class": "015692",
	"hljs-meta": "015692",
	"hljs-selector-pseudo": "015692",
	"hljs-attr": "015692",
	"hljs-attribute": "803378",
	"hljs-name": "b75501",
	"hljs-type": "b75501",
	"hljs-number": "b75501",
	"hljs-selector-id": "b75501",
	"hljs-template-tag": "b75501",
	"hljs-built_in": "b75501",
	"hljs-title": "b75501",
	"hljs-literal": "b75501",
	"hljs-string": "54790d",
	"hljs-regexp": "54790d",
	"hljs-symbol": "54790d",
	"hljs-variable": "54790d",
	"hljs-template-variable": "54790d",
	"hljs-link": "54790d",
	"hljs-selector-attr": "54790d",
	"hljs-meta-string": "54790d",
	"hljs-bullet": "535a60",
	"hljs-code": "535a60",
	"hljs-deletion": "c02d2e",
	"hljs-addition": "2f6f44",
};

const pickColor = (classes: string[]): string | undefined => {
	for (const cls of classes) {
		if (CLASS_COLOR_MAP[cls]) return CLASS_COLOR_MAP[cls];
		// fallback by suffix without hljs- prefix
		const noPrefix = cls.startsWith("hljs-") ? cls.slice(5) : cls;
		const match = Object.entries(CLASS_COLOR_MAP).find(([k]) => k.endsWith(noPrefix));
		if (match) return match[1];
	}
	return undefined;
};

const collectTokens = (nodes: HastNode[], inherited: string[] = []): Token[] => {
	const tokens: Token[] = [];

	for (const node of nodes) {
		if ((node as HastText).type === "text") {
			tokens.push({ text: (node as HastText).value, classes: inherited });
		} else {
			const element = node as HastElement;
			const nextClasses = [...inherited, ...(element.properties?.className ?? [])];
			tokens.push(...collectTokens(element.children, nextClasses));
		}
	}

	return tokens;
};

const tokensToRuns = (tokens: Token[], TextRunCtor: any) => {
	const runs: any[] = [];
	let pendingBreak = false;

	for (const token of tokens) {
		const color = pickColor(token.classes);
		const parts = token.text.split("\n");

		for (let i = 0; i < parts.length; i++) {
			if (i > 0) {
				// newline between parts
				runs.push(new TextRunCtor({ text: "", break: 1 }));
			}

			const part = parts[i];
			if (!part) {
				pendingBreak = false;
				continue;
			}

			const props: any = { text: part };
			if (color) props.color = color;
			if (pendingBreak && !props.break) props.break = 1;

			runs.push(new TextRunCtor(props));
			pendingBreak = false;
		}

		// track trailing newline: split keeps empty string at end
		if (token.text.endsWith("\n")) {
			pendingBreak = true;
		}
	}

	return runs;
};

export const highlightCodeToRuns = async (code: string, language: string | undefined, TextRunCtor: any) => {
	const lang = normalizeLangName(language);
	if (lang) await loadLanguage(lang);

	const langToUse = lang && checkLanguage(lang) ? lang : "none";
	const tree = lowlight.highlight(langToUse, code) as unknown as { children: HastNode[] };
	const tokens = collectTokens(tree.children);
	return tokensToRuns(tokens, TextRunCtor);
};
