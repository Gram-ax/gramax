import type ContextualCatalog from "@core/FileStructue/Catalog/ContextualCatalog";
import { ItemRef } from "@core/FileStructue/Item/ItemRef";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import WorkspaceManager from "@ext/workspace/WorkspaceManager";
import { TableDB } from "../../../../../logic/components/tableDB/table";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import UiLanguage from "../../../../localization/core/model/Language";
import UserInfo from "../../../../security/logic/User/UserInfo";
import MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import MarkdownParser from "../Parser";
import ParserContext from "./ParserContext";

export default class TestContext implements ParserContext {
	constructor(
		private _itemRef: ItemRef,
		private _catalog: ContextualCatalog,
		readonly fp: FileProvider,
		readonly parser: MarkdownParser,
		readonly formatter: MarkdownFormatter,
	) {}

	getDiagramRendererServerUrl(): string {
		return process.env.DIAGRAM_RENDERER_SERVICE_URL;
	}

	getWorkspaceManager(): WorkspaceManager {
		return null;
	}

	getItemByPath(): Article {
		return this._catalog.findArticleByItemRef(this._itemRef);
	}

	getArticle(): Article {
		return this._catalog.findArticleByItemRef(this._itemRef);
	}

	getCatalog() {
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

	getProp(): any {
		return {};
	}

	getRepositoryProvider(): RepositoryProvider {
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
