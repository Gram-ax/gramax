import { DocportalPage } from "@components/Pages/components/DocportalPage";
import type { PageProps } from "@components/Pages/models/Pages";
import { ApplyPageMiddleware } from "../logic/Api/ApplyMiddleware";
import { getAliasRedirect } from "../logic/aliasRedirect";
import { withContext } from "../logic/Context/ContextHook";
import { getNodeQuery } from "../logic/pageQueryUtils";

export default function Home(data: PageProps) {
	return <DocportalPage data={data} />;
}

const getArticlePath = (query: { path?: string | string[] }) => {
	const path = query?.path;
	if (!path) return "";

	const pathParts = Array.isArray(path) ? path : [path];
	return `/${pathParts.map((p) => p.replaceAll("/", "%2F")).join("/")}`;
};

export function getServerSideProps({ req, res, query }) {
	const articlePath = getArticlePath(query);
	const nodeQuery = getNodeQuery(query, articlePath);

	return ApplyPageMiddleware(
		async function ({ req, res }) {
			const ctx = await this.app.contextFactory.fromNode({ req, res, query: nodeQuery });

			const props = await withContext<PageProps>(
				ctx,
				async () =>
					await this.commands.page.getPageData.do({
						options: { mode: "read" },
						path: articlePath,
						ctx,
					}),
			);

			const articleProps = props?.data?.articleProps;
			const aliasRedirect = getAliasRedirect(articleProps, query);
			if (aliasRedirect) return { redirect: aliasRedirect };

			const errorCode = articleProps?.errorCode;
			if (errorCode) res.statusCode = errorCode;

			return {
				props,
			};
		},
		{ plugins: { getRoute: () => articlePath } },
	)({ req, res, query: nodeQuery });
}
