import type { PageProps } from "@components/Pages/models/Pages";
import Path from "@core/FileProvider/Path/Path";
import RouterPathProvider from "@core/RouterPath/RouterPathProvider";
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

		const ctx = await app.contextFactory.fromNode({ req, res, query: Object.fromEntries(path.searchParams) });
		const data = await withContext<PageProps>(ctx, () => commands.page.getPageData.do({ path: fullPath, ctx }));

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
