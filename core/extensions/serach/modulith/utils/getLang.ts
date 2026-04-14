import Localizer from "@ext/localization/core/Localizer";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import type { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";

export function getLang(logicPath: string, catalogLang: ContentLanguage | undefined): ArticleLanguage {
	return Localizer.extract(Localizer.sanitize(logicPath)) ?? catalogLang ?? "none";
}
