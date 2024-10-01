import LinkResourceManager from "@core/Link/LinkResourceManager";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import { Item } from "../../../../../logic/FileStructue/Item/Item";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import { TableDB } from "../../../../../logic/components/tableDB/table";
import UiLanguage from "../../../../localization/core/model/Language";
import UserInfo from "../../../../security/logic/User/UserInfo2";
import MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import MarkdownParser from "../Parser";

export default interface ParserContext {
	getItemByPath(itemPath: Path): Item;
	getResourceManager(): ResourceManager;
	getLinkManager(): LinkResourceManager;
	getRootLogicPath(): Path;
	getArticle(): Article;
	getCatalog(): Catalog;
	getStorageId(): string;
	getRootPath(): Path;
	getBasePath(): Path;
	getIsLogged(): boolean;
	getLanguage(): UiLanguage;
	getDiagramRendererServerUrl(): string;
	getProp(propName: string): any;
	getTablesManager(): TableDB;
	getUserByMail(mail: string): Promise<UserInfo>;
	createContext(article: Article): ParserContext;
	fp: FileProvider;
	parser: MarkdownParser;
	formatter: MarkdownFormatter;
	snippet: Set<string>;
	icons: Set<string>;
}

export abstract class BaseContext {
	private _snippet = new Set<string>();

	get snippet() {
		return this._snippet;
	}

	private _icons = new Set<string>();

	get icons() {
		return this._icons;
	}

	abstract getArticle(): Article;

	getProp(propName: string): any {
		const variables = {};
		let currentArticle = this.getArticle() as Item;
		while (currentArticle) {
			if (currentArticle.props[propName]) {
				const match = currentArticle.props[propName];
				if (typeof match !== "object") return match;
				for (const [key, value] of Object.entries(match))
					if (!(key in variables))
						if (typeof value === "number") variables[key] = value.toString();
						else variables[key] = value;
			}
			currentArticle = currentArticle.parent;
		}
		return variables;
	}
}
