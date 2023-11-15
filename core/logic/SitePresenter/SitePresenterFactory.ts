import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Navigation from "../../extensions/navigation/catalog/main/logic/Navigation";
import Searcher from "../../extensions/search/Searcher";
import StorageProvider from "../../extensions/storage/logic/StorageProvider";
import Context from "../Context/Context";
import Library from "../Library/Library";
import ErrorArticlePresenter from "./ErrorArticlePresenter";
import SitePresenter from "./SitePresenter";

export default class SitePresenterFactory {
	constructor(
		private _lib: Library,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _sm: Searcher,
		private _sp: StorageProvider,
		private _errorArticlesProvider: ErrorArticlePresenter,
		private _isServerApp: boolean,
	) {}

	public fromContext(context: Context): SitePresenter {
		const nav = new Navigation();
		return new SitePresenter(
			nav,
			this._lib,
			this._parser,
			this._parserContextFactory,
			this._sm,
			this._sp,
			this._errorArticlesProvider,
			this._isServerApp,
			context,
		);
	}
}
