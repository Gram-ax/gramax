import { LanguageFn } from "highlight.js";

const noneLang: LanguageFn = () => {
	return {
		name: "NoneLang",
		aliases: [""],
		keywords: {
			keyword: "",
			literal: "",
			built_in: "",
		},
		contains: [],
	};
};

export default noneLang;
