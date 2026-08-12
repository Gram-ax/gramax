import type { ReadonlyCatalog } from "@core/FileStructue/Catalog/ReadonlyCatalog";
import type RepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import { Level, trace } from "@ext/loggers/opentelemetry";
import type { TableDB } from "@ext/tableDB/table";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import type Path from "../../../../../logic/FileProvider/Path/Path";
import type { Article } from "../../../../../logic/FileStructue/Article/Article";
import type UiLanguage from "../../../../localization/core/model/Language";
import type UserRepository from "../../../../security/logic/UserRepository";
import type MarkdownFormatter from "../../edit/logic/Formatter/Formatter";
import type MarkdownParser from "../Parser";
import type ParserContext from "./ParserContext";
import { ArticleParserContext } from "./ParserContext";

class ParserContextFactory {
	private _wm: WorkspaceManager;
	private _getDiagramRendererServerUrl?: () => Promise<string | undefined> | string | undefined;

	constructor(
		private _basePath: Path,
		private _tablesManager: TableDB,
		private _parser: MarkdownParser,
		private _formatter: MarkdownFormatter,
		private _rp: RepositoryProvider,
		private _ur?: UserRepository,
	) {}

	@trace({ level: Level.Important, omitArgs: true })
	mount(
		wm: WorkspaceManager,
		getDiagramRendererServerUrl?: () => Promise<string | undefined> | string | undefined,
	): void {
		this._wm = wm;
		this._getDiagramRendererServerUrl = getDiagramRendererServerUrl;
	}

	async fromArticle(article: Article, catalog: ReadonlyCatalog, language: UiLanguage): Promise<ParserContext> {
		const diagramRendererServerUrl = this._getDiagramRendererServerUrl
			? await this._getDiagramRendererServerUrl()
			: (await this._wm.current().config()).services?.diagramRenderer?.url;

		return new ArticleParserContext(
			article,
			catalog,
			this._basePath,
			language,
			diagramRendererServerUrl,
			this._tablesManager,
			this._ur ? this._ur.getUser.bind(this._ur) : (m) => ({ name: m }),
			this._wm,
			this._rp,
			this._wm.current().getFileProvider(),
			this._parser,
			this._formatter,
		);
	}
}

export default ParserContextFactory;
