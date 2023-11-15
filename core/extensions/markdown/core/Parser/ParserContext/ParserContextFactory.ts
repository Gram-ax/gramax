import Path from "../../../../../logic/FileProvider/Path/Path";
import FileProvider from "../../../../../logic/FileProvider/model/FileProvider";
import { Article } from "../../../../../logic/FileStructue/Article/Article";
import { Catalog } from "../../../../../logic/FileStructue/Catalog/Catalog";
import { TableDB } from "../../../../../logic/components/tableDB/table";
import Language from "../../../../localization/core/model/Language";
import UserRepository from "../../../../security/logic/UserRepository";
import MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import MarkdownParser from "../Parser";
import ArticleContext from "./ArticleContext";
import ParserContext from "./ParserContext";

class ParserContextFactory {
	constructor(
		private _basePath: Path,
		private _fp: FileProvider,
		private _tablesManager: TableDB,
		private _parser: MarkdownParser,
		private _formatter: MarkdownFormatter,
		private _enterpriseServerUrl: string,
		private _ur?: UserRepository,
	) {}

	fromArticle(article: Article, catalog: Catalog, language: Language, isLogged: boolean): ParserContext {
		return new ArticleContext(
			article,
			catalog,
			this._basePath,
			language,
			isLogged,
			this._enterpriseServerUrl,
			this._tablesManager,
			this._ur ? this._ur.getUser.bind(this._ur) : (m) => ({ name: m }),
			this._fp,
			this._parser,
			this._formatter,
		);
	}
}

export default ParserContextFactory;
