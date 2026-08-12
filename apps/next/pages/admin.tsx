import AdminLoginLayout from "@ext/admin/AdminLayout";
import Head from "next/head";
import { ApplyPageMiddleware } from "../logic/Api/ApplyMiddleware";
import { getNodeQuery } from "../logic/pageQueryUtils";

export default () => {
	return (
		<>
			<Head>
				<title>Admin</title>
			</Head>
			<AdminLoginLayout />
		</>
	);
};

const getArticlePath = (query: { path?: string | string[] }) => {
	const path = query?.path;
	if (!path) return undefined;

	return `/${(Array.isArray(path) ? path : [path]).join("/")}`;
};

export function getServerSideProps({ req, res, query }) {
	const articlePath = getArticlePath(query);
	const nodeQuery = getNodeQuery(query, articlePath);

	return ApplyPageMiddleware(async function ({ req, res }) {
		const ctx = await this.app.contextFactory.fromNode({ req, res, query: nodeQuery });

		const data = await this.commands.page.getPageData.do({
			options: { mode: "read" },
			path: articlePath,
			ctx,
		});

		return {
			props: data,
		};
	})({ req, res, query: nodeQuery });
}
