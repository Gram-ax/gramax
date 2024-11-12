import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";
import getPageDataContext from "./getPageDataContext";

const getHomePageData: Command<{ ctx: Context }, { data: HomePageData; context: PageDataContext }> = Command.create({
	path: "index",

	async do({ ctx }) {
		const { wm, sitePresenterFactory } = this._app;

		if (!wm.hasWorkspace()) {
			return {
				data: { catalogLinks: {} },
				context: getPageDataContext({ ctx, app: this._app, isArticle: false }),
			};
		}

		const workspace = wm.current();
		const dataProvider = sitePresenterFactory.fromContext(ctx);
		const data = await dataProvider.getHomePageData(workspace.config());
		const context = getPageDataContext({
			ctx,
			app: this._app,
			isArticle: false,
			isReadOnly: this._app.conf.isReadOnly,
		});

		return {
			data,
			context,
		};
	},
});

export default getHomePageData;
