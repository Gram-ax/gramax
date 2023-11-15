import { Category } from "../../../../logic/FileStructue/Category/Category";
import FileStructure, { FSProps } from "../../../../logic/FileStructue/FileStructure";
import { Item } from "../../../../logic/FileStructue/Item/Item";
import Language, { defaultLanguage } from "../model/Language";

export default class FSLocalizationRules {
	static bind(fs: FileStructure): void {
		fs.addRule(FSLocalizationRules._rule);
		fs.addSaveRule(FSLocalizationRules._saveRule);
		fs.addArticleSaveRule(FSLocalizationRules._saveRule);
		fs.addFilterRule(FSLocalizationRules._filterRule);
	}

	private static _rule(item: Item, catalogProps: FSProps, isRootCategory = false): void {
		let language = getLanguageByPath(item.ref.path.value);
		let fileNameHasLang = true;
		if (!language) {
			fileNameHasLang = false;
			language = catalogProps[localizationProps.language] ?? defaultLanguage;
		}
		if (isRootCategory) catalogProps[localizationProps.allLanguages] = true;
		item.props[localizationProps.language] = language;
		if (fileNameHasLang && getLanguageByPath(item.logicPath))
			item.logicPath = item.logicPath.slice(0, item.logicPath.length - 3);
		if (!catalogProps[localizationProps.languages]) catalogProps[localizationProps.languages] = new Set<string>();
		(catalogProps[localizationProps.languages] as Set<string>).add(language);
	}

	private static _filterRule(parent: Category, catalogProps: any, item: Item): boolean {
		return (
			catalogProps[localizationProps.allLanguages] ||
			parent.props[localizationProps.language] == item.props[localizationProps.language]
		);
	}

	private static _saveRule(props: FSProps): FSProps {
		const p = { ...props };
		delete p[localizationProps.languages];
		delete p[localizationProps.allLanguages];
		return p;
	}
}

export enum localizationProps {
	language = "lang",
	languages = "catalogLangs",
	allLanguages = "allLanguages",
}

function getLanguageByPath(path: string): string {
	let langCode = path.match(/_(\w\w)\.md$/)?.[1];
	if (langCode && !(<any>Object).values(Language).includes(langCode)) langCode = null;
	return langCode;
}
