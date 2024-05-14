import type { CatalogProps } from "@core/FileStructue/Catalog/Catalog";
import { Category } from "../../../../logic/FileStructue/Category/Category";
import FileStructure from "../../../../logic/FileStructue/FileStructure";
import { Item } from "../../../../logic/FileStructue/Item/Item";
import Language, { defaultLanguage } from "../model/Language";

export type FSLocalizationProps = {
	lang?: Language;
	catalogLangs?: Set<string>;
	allLanguages?: boolean;
};

export default class FSLocalizationRules {
	static bind(fs: FileStructure): void {
		fs.addRule(FSLocalizationRules._rule);
		fs.addSaveRule(FSLocalizationRules._saveRule);
		fs.addArticleSaveRule(FSLocalizationRules._saveRule);
		fs.addFilterRule(FSLocalizationRules._filterRule);
	}

	private static _rule(item: Item, catalogProps: CatalogProps, isRootCategory = false): void {
		const language = getLanguageByPath(item.ref.path.value) ?? catalogProps.lang ?? defaultLanguage;
		const fileNameHasLang = !!language;
		catalogProps.allLanguages = isRootCategory;
		item.props.lang = Language[language];
		if (fileNameHasLang && getLanguageByPath(item.logicPath))
			item.logicPath = item.logicPath.slice(0, item.logicPath.length - 3);
		if (!catalogProps.catalogLangs) catalogProps.catalogLangs = new Set<string>();
		catalogProps.catalogLangs.add(language);
	}

	private static _filterRule(parent: Category, catalogProps: any, item: Item): boolean {
		return catalogProps.allLanguages || parent.props.lang == item.props.lang;
	}

	private static _saveRule(props: FSLocalizationProps) {
		const p = { ...props };
		delete p.catalogLangs;
		delete p.allLanguages;
		return p as any;
	}
}

function getLanguageByPath(path: string): string {
	let langCode = path.match(/_(\w\w)\.md$/)?.[1];
	if (langCode && !(<any>Object).values(Language).includes(langCode)) langCode = null;
	return langCode;
}
