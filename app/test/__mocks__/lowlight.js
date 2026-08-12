module.exports = {
	createLowlight: () => {
		const languages = new Set(["none"]);

		// What lowlight returns is a hast tree, and callers may hand it to any hast utility — so the shape has
		// to be a real one: `type: "root"` on the tree and a `tagName` on every element. hast-util-to-html
		// rejects a node missing either.
		const toTree = (value = "", classes = []) => ({
			type: "root",
			children: [
				{
					type: "element",
					tagName: "span",
					properties: { className: classes },
					children: [{ type: "text", value }],
				},
			],
		});

		return {
			register: (lang) => languages.add(lang),
			registered: (lang) => languages.has(lang),
			listLanguages: () => Array.from(languages),
			highlight: (lang, value) => {
				const hasLang = lang !== "none" && languages.has(lang);
				return toTree(value, hasLang ? ["hljs-keyword"] : []);
			},
			highlightAuto: (value) => toTree(value),
		};
	},
	common: {},
	toJsxRuntime: () => ({}),
};
