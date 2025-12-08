module.exports = {
	createLowlight: () => {
		const languages = new Set(["none"]);

		const toTree = (value = "", classes = []) => ({
			children: [{ type: "element", properties: { className: classes }, children: [{ type: "text", value }] }],
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
