import Localizer from "@ext/localization/core/Localizer";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import type { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";

export function getLang(
	logicPath: string,
	catalogLang: ContentLanguage | undefined,
	supportedLanguages: ContentLanguage[],
): ArticleLanguage {
	const language = Localizer.extract(Localizer.sanitize(logicPath));
	if (language && supportedLanguages?.includes(language)) return language;
	return catalogLang ?? "none";
}
