import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import Path from "../../../../../logic/FileProvider/Path/Path";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import { TableDB } from "../../../../../logic/components/tableDB/table";
import UiLanguage from "../../../../localization/core/model/Language";
import UserRepository from "../../../../security/logic/UserRepository";
import MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import MarkdownParser from "../Parser";
import ArticleContext from "./ArticleContext";
import ParserContext from "./ParserContext";

class ParserContextFactory {
	constructor(
		private _basePath: Path,
		private _wm: WorkspaceManager,
		private _tablesManager: TableDB,
		private _parser: MarkdownParser,
		private _formatter: MarkdownFormatter,
		private _ur?: UserRepository,
	) {}

	async fromArticle(
		article: Article,
		catalog: ReadonlyCatalog,
		language: UiLanguage,
		isLogged: boolean,
	): Promise<ParserContext> {
		return new ArticleContext(
			article,
			catalog,
			this._basePath,
			language,
			isLogged,
			(await this._wm.current().config()).services?.diagramRenderer?.url,
			this._tablesManager,
			this._ur ? this._ur.getUser.bind(this._ur) : (m) => ({ name: m }),
			this._wm.current().getFileProvider(),
			this._parser,
			this._formatter,
		);
	}
}

export default ParserContextFactory;
