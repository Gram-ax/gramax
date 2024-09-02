import HomePage from "@components/HomePage/HomePage";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import Localizer from "@ext/localization/core/Localizer";
import { withContext } from "apps/next/logic/Context/ContextHook";
import { ApplyPageMiddleware } from "../logic/Api/ApplyMiddleware";

export default function Home({ data, context }: { data: ArticlePageData & HomePageData; context: PageDataContext }) {
	return context.isArticle ? <ArticleViewContainer /> : <HomePage data={data}></HomePage>;
}

export function getServerSideProps({ req, res, query }) {
	return ApplyPageMiddleware(async function ({ req, res, query }) {
		const articlePath = query?.path ? "/" + query.path.join("/") : "";
		query.l = Localizer.extract(articlePath);
		const ctx = this.app.contextFactory.from(req, res, query);

		const props = await withContext(
			ctx,
			async () =>
				await this.commands.page.getPageData.do({
					path: decodeURIComponent(articlePath),
					ctx,
				}),
		);

		return {
			props,
		};
	})({ req, res, query });
}
