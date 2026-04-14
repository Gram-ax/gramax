import HomePage from "@components/HomePage/HomePage";
import type { PageProps } from "@components/Pages/models/Pages";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import Localizer from "@ext/localization/core/Localizer";
import { withContext } from "apps/next/logic/Context/ContextHook";
import { ApplyPageMiddleware } from "../logic/Api/ApplyMiddleware";

export default function Home({ data, page }: PageProps) {
	return page === "article" ? <ArticleViewContainer data={data} /> : <HomePage data={data} />;
}

export function getServerSideProps({ req, res, query }) {
	return ApplyPageMiddleware(async function ({ req, res, query }) {
		const articlePath = query?.path ? `/${query.path.map((p) => p.replaceAll("/", "%2F")).join("/")}` : "";
		query.l = Localizer.extract(articlePath);
		const ctx = await this.app.contextFactory.fromNode({ req, res, query });

		const props = await withContext<PageProps>(
			ctx,
			async () =>
				await this.commands.page.getPageData.do({
					path: articlePath,
					ctx,
				}),
		);

		const errorCode = props?.data?.articleProps?.errorCode;
		if (errorCode) res.statusCode = errorCode;

		return {
			props,
		};
	})({ req, res, query });
}
