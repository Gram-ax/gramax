import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Navigation from "../../extensions/navigation/catalog/main/logic/Navigation";
import Context from "../Context/Context";
import Library from "../Library/Library";
import ErrorArticlePresenter from "./ErrorArticlePresenter";
import SitePresenter from "./SitePresenter";

export default class SitePresenterFactory {
	constructor(
		private _lib: Library,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _grp: GitRepositoryProvider,
		private _errorArticlesProvider: ErrorArticlePresenter,
	) {}

	public fromContext(context: Context): SitePresenter {
		const nav = new Navigation();
		return new SitePresenter(
			nav,
			this._lib,
			this._parser,
			this._parserContextFactory,
			this._grp,
			this._errorArticlesProvider,
			context,
		);
	}
}
