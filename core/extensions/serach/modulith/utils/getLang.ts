import Localizer from "@ext/localization/core/Localizer";
import { ContentLanguage } from "@ext/localization/core/model/Language";
import { ArticleLanguage } from "@ext/serach/modulith/SearchArticle";

export function getLang(logicPath: string, catalogLang: ContentLanguage | undefined): ArticleLanguage {
	return Localizer.extract(Localizer.sanitize(logicPath)) ?? catalogLang ?? "none";
}