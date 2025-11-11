import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import LinkResourceManager from "@core/Link/LinkResourceManager";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import { Item } from "../../../../../logic/FileStructue/Item/Item";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import { TableDB } from "../../../../../logic/components/tableDB/table";
import UiLanguage from "../../../../localization/core/model/Language";
import UserInfo from "../../../../security/logic/User/UserInfo";
import MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import MarkdownParser from "../Parser";
import { Question } from "@ext/markdown/elements/question/types";

export default interface ParserContext {
	getItemByPath(itemPath: Path): Item;
	getResourceManager(): ResourceManager;
	getLinkManager(): LinkResourceManager;
	getRootLogicPath(): Path;
	getArticle(): Article;
	getCatalog(): ReadonlyCatalog;
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
	questions: Map<string, Question>;
}

export abstract class BaseContext {
	private _snippet = new Set<string>();
	private _questions = new Map<string, Question>();
	private _icons = new Set<string>();

	get snippet() {
		return this._snippet;
	}

	get questions() {
		return this._questions;
	}

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
