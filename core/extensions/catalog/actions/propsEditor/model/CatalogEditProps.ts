import Style from "@components/HomePage/Cards/model/Style";
import type { ContentLanguage } from "@ext/localization/core/model/Language";
import { Syntax } from "@ext/markdown/core/edit/logic/Formatter/Formatters/typeFormats/model/Syntax";
import { Property } from "@ext/properties/models";

export interface CatalogEditProps {
	title: string;
	url: string;
	docroot?: string;
	versions?: string[];
	description?: string;
	language?: ContentLanguage;
	filterProperty?: string;
	style?: Style;
	properties?: Property[];
	// private?: string[];
	syntax?: Syntax;
	logo?: string;
	logo_dark?: string;
}

export default CatalogEditProps;
