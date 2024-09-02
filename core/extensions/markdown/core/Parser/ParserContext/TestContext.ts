import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import ResourceManager from "../../../../../logic/Resource/ResourceManager";
import { TableDB } from "../../../../../logic/components/tableDB/table";
import UiLanguage from "../../../../localization/core/model/Language";
import UserInfo from "../../../../security/logic/User/UserInfo2";
import MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import MarkdownParser from "../Parser";
import ParserContext, { BaseContext } from "./ParserContext";

export default class TestContext extends BaseContext implements ParserContext {
	private _linkManager: ResourceManager;
	private _resourceManager: ResourceManager;

	constructor(
		private _itemRef: ItemRef,
		private _catalog: Catalog,
		readonly fp: FileProvider,
		readonly parser: MarkdownParser,
		readonly formatter: MarkdownFormatter,
	) {
		super();
		this._linkManager = new ResourceManager(fp, this._itemRef.path);
		this._resourceManager = new ResourceManager(fp, this._itemRef.path);
	}

	getDiagramRendererServerUrl(): string {
		return process.env.DIAGRAM_RENDERER_SERVICE_URL;
	}

	getResourceManager(): ResourceManager {
		return this._resourceManager;
	}

	getLinkManager(): ResourceManager {
		return this._linkManager;
	}

	getItemByPath(): Article {
		return this._catalog.findArticleByItemRef(this._itemRef);
	}

	getArticle(): Article {
		return this._catalog.findArticleByItemRef(this._itemRef);
	}

	getCatalog(): Catalog {
		return this._catalog;
	}

	getStorageId(): string {
		return "/testStorageId";
	}

	getRootPath(): Path {
		return new Path("/testRootPath");
	}

	getRootLogicPath(): Path {
		return new Path("/testRootLogicPath");
	}

	getBasePath(): Path {
		return new Path("/testBasePath");
	}

	getIsLogged(): boolean {
		return true;
	}

	getLanguage(): UiLanguage {
		return UiLanguage.ru;
	}

	getTablesManager(): TableDB {
		return null;
	}

	getUserByMail(): Promise<UserInfo> {
		return Promise.resolve({
			name: "Test UserName",
			mail: "testusermail@ics-it.ru",
			id: "testId",
		});
	}

	createContext(article: Article) {
		return new TestContext(article.ref, this._catalog, this.fp, this.parser, this.formatter);
	}
}
