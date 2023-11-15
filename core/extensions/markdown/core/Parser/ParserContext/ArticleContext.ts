import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import { Item } from "../../../../../logic/FileStructue/Item/Item";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import { TableDB } from "../../../../../logic/components/tableDB/table";
import Language from "../../../../localization/core/model/Language";
import UserInfo from "../../../../security/logic/User/UserInfo2";
import MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import MarkdownParser from "../Parser";

import ParserContext, { BaseContext } from "./ParserContext";

export default class ArticleContext extends BaseContext implements ParserContext {
	private _resourceManager: ResourceManager;

	constructor(
		private _article: Article,
		private _catalog: Catalog,
		private _basePath: Path,
		private _language: Language,
		private _isLogged: boolean,
		private _enterpriseServerUrl: string,
		private _tablesManager: TableDB,
		private _getUserByMail: (mail: string) => Promise<UserInfo> | UserInfo,
		readonly fp: FileProvider,
		readonly parser: MarkdownParser,
		readonly formatter: MarkdownFormatter,
	) {
		super();
		this._resourceManager = new ResourceManager(
			this._catalog
				?.getRootCategoryRef()
				.path.parentDirectoryPath.subDirectory(this._article.ref.path.parentDirectoryPath),
			this._catalog?.getRootCategoryRef().path.parentDirectoryPath,
		);
	}

	getEnterpriseServerUrl(): string {
		return this._enterpriseServerUrl;
	}

	getResourceManager(): ResourceManager {
		return this._resourceManager;
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
		return new Path(this._catalog?.getName());
	}

	getRootPath() {
		return this._catalog?.getRootCategoryPath();
	}

	getBasePath() {
		return this._basePath;
	}

	getIsLogged() {
		return this._isLogged;
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
}
