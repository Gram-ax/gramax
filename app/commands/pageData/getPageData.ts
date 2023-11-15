import Context from "@core/Context/Context";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticleData, HomePageData } from "@core/SitePresenter/SitePresenter";
import { Command } from "../../types/Command";

const getPageData: Command<
	{ path: string; ctx: Context },
	{ data: HomePageData | ArticleData; context: PageDataContext }
> = Command.create({
	do({ path, ctx }) {
		if (!path || path == "/") return this._commands.page.getHomePageData.do({ ctx });
		return this._commands.page.getArticlePageData.do({
			path: path.split("/").filter((x) => x),
			ctx,
		});
	},
});

export default getPageData;
