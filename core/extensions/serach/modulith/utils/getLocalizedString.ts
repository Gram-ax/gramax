import type { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";
import type { LocalizedString } from "@ext/tableDB/table";

export const getLocalizedString = (obj: LocalizedString, lang: ArticleLanguage) => {
	return lang === "none" ? obj.default : (obj[lang] ?? obj.default);
};
