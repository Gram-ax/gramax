import CustomArticlePresenter from "@core/SitePresenter/CustomArticlePresenter";
import GitRepositoryProvider from "@ext/git/core/Repository/RepositoryProvider";
import type WorkspaceManager from "@ext/workspace/WorkspaceManager";
import MarkdownParser from "../../extensions/markdown/core/Parser/Parser";
import ParserContextFactory from "../../extensions/markdown/core/Parser/ParserContext/ParserContextFactory";
import Navigation from "../../extensions/navigation/catalog/main/logic/Navigation";
import Context from "../Context/Context";
import SitePresenter from "./SitePresenter";

export default class SitePresenterFactory {
	constructor(
		private _wm: WorkspaceManager,
		private _parser: MarkdownParser,
		private _parserContextFactory: ParserContextFactory,
		private _grp: GitRepositoryProvider,
		private _customArticlePresenter: CustomArticlePresenter,
		private _isReadOnly: boolean,
	) {}

	public fromContext(context: Context): SitePresenter {
		const nav = new Navigation();
		return new SitePresenter(
			nav,
			this._wm.current(),
			this._parser,
			this._parserContextFactory,
			this._grp,
			this._customArticlePresenter,
			context,
			this._isReadOnly,
		);
	}
}
