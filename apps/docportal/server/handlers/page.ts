import type { PageProps } from "@components/Pages/models/Pages";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
import { getAliasRedirect } from "../../../next/logic/aliasRedirect";
import { getNodeQuery } from "../../../next/logic/pageQueryUtils";
import { prependBasePath } from "../../client/logic/basePath";
import { renderHtml } from "../ssr/ssr";
import type ServerContext from "../types/ServerContext";
import withContext from "../utils/withContext";

const isNaturalPath = (path: string) => {
	const newPath = new Path(path);
	return newPath.extension === null;
};

const getDataFromPath = async (path: string) => {
	if (!isNaturalPath(path)) {
		return {
			catalogName: null,
			articlePath: null,
			logicPath: null,
			fullPath: null,
		};
	}

	const splittedPath = path.split("/").filter((x) => x);

	const catalogName = splittedPath[0];
	const articlePath = splittedPath.slice(1).join("/");
	const logicPath = RouterPathProvider.getLogicPath(path);

	return {
		catalogName,
		articlePath,
		logicPath,
		fullPath: path.slice(1),
	};
};

const page = async (serverContext: ServerContext) => {
	const { path, req, res, app, commands } = serverContext;

	try {
		const { fullPath } = await getDataFromPath(path.pathname);
		if (!fullPath && path.pathname !== "/") return;
		const isAdmin = path.pathname.startsWith("/admin");

		const nodeQuery = getNodeQuery(Object.fromEntries(path.searchParams), path.pathname);
		const ctx = await app.contextFactory.fromNode({ req, res, query: nodeQuery });
		const data = await withContext<PageProps>(ctx, () =>
			commands.page.getPageData.do({ path: fullPath, ctx, options: { mode: "read" } }),
		);

		const articleProps = data?.page === "article" ? data.data.articleProps : undefined;
		const aliasRedirect = getAliasRedirect(articleProps, path.searchParams);
		if (aliasRedirect)
			return res.mergeInto(
				new Response(null, {
					status: aliasRedirect.statusCode,
					headers: {
						Location: prependBasePath(aliasRedirect.destination),
						"Cache-Control": "no-store",
					},
				}),
			);

		const html = renderHtml(isAdmin, data);
		return res.mergeInto(new Response(html, { headers: { "Content-Type": "text/html" } }));
	} catch (error) {
		console.error("Page render error:", error);
		return res.mergeInto(
			new Response(JSON.stringify({ error }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			}),
		);
	}
};

export default page;
