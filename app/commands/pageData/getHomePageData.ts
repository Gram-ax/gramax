import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import { HomePageData } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";
import getPageDataContext from "./getPageDataContext";

const getHomePageData: Command<{ ctx: Context }, { data: HomePageData; context: PageDataContext }> = Command.create({
	path: "index",

	async do({ ctx }) {
		const { sitePresenterFactory } = this._app;
		const dataProvider = sitePresenterFactory.fromContext(ctx);
		const data = await dataProvider.getHomePageData();
		const context = getPageDataContext({ ctx, app: this._app, isArticle: false });

		return {
			data,
			context,
		};
	},
});

export default getHomePageData;
