/** biome-ignore-all lint/suspicious/noExplicitAny: it's ok */
import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import type { TableDB } from "../../../../../logic/components/tableDB/table";
import type FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import type { Article } from "../../../../../logic/FileStructue/Article/Article";
import type { Item } from "../../../../../logic/FileStructue/Item/Item";
import type UiLanguage from "../../../../localization/core/model/Language";
import type UserInfo from "../../../../security/logic/User/UserInfo";
import type MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import type MarkdownParser from "../Parser";

export default interface ParserContext {
	getItemByPath(itemPath: Path): Item;
	getRootLogicPath(): Path;
	getArticle(): Article;
	getCatalog(): ReadonlyCatalog;
	getStorageId(): string;
	getRootPath(): Path;
	getBasePath(): Path;
	getLanguage(): UiLanguage;
	getDiagramRendererServerUrl(): string;
	getProp(propName: string): any;
	getTablesManager(): TableDB;
	getUserByMail(mail: string): Promise<UserInfo>;
	createContext(article: Article): ParserContext;
	getWorkspaceManager(): WorkspaceManager;
	getRepositoryProvider(): RepositoryProvider;
	fp: FileProvider;
	parser: MarkdownParser;
	formatter: MarkdownFormatter;
}

export class ArticleParserContext implements ParserContext {
	constructor(
		private _article: Article,
		private _catalog: ReadonlyCatalog,
		private _basePath: Path,
		private _language: UiLanguage,
		private _diagramRendererServerUrl: string,
		private _tablesManager: TableDB,
		private _getUserByMail: (mail: string) => Promise<UserInfo> | UserInfo,
		private _wm: WorkspaceManager,
		private _rp: RepositoryProvider,
		readonly fp: FileProvider,
		readonly parser: MarkdownParser,
		readonly formatter: MarkdownFormatter,
	) {}

	getDiagramRendererServerUrl(): string {
		return this._diagramRendererServerUrl;
	}

	getItemByPath(itemPath: Path): Item {
		return this._catalog.findItemByItemPath(itemPath);
	}

	getArticle() {
		return this._article;
	}

	getCatalog() {
		return this._catalog;
	}

	getStorageId() {
		return this._article.ref.storageId;
	}

	getRootLogicPath() {
		return new Path(this._catalog?.name);
	}

	getRootPath() {
		return this._catalog?.getRootCategoryPath();
	}

	getBasePath() {
		return this._basePath;
	}

	getLanguage() {
		return this._language;
	}

	getTablesManager(): TableDB {
		return this._tablesManager;
	}

	async getUserByMail(mail: string): Promise<UserInfo> {
		return await this._getUserByMail(mail);
	}

	getWorkspaceManager(): WorkspaceManager {
		return this._wm;
	}

	getRepositoryProvider(): RepositoryProvider {
		return this._rp;
	}

	createContext(article: Article) {
		return new ArticleParserContext(
			article,
			this._catalog,
			this._basePath,
			this._language,
			this._diagramRendererServerUrl,
			this._tablesManager,
			this._getUserByMail,
			this._wm,
			this._rp,
			this.fp,
			this.parser,
			this.formatter,
		);
	}

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
