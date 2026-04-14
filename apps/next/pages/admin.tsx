import AdminLoginLayout from "@ext/admin/AdminLayout";
import localizer from "@ext/localization/core/Localizer";
import Head from "next/head";
import { ApplyPageMiddleware } from "../logic/Api/ApplyMiddleware";

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

export function getServerSideProps({ req, res, query }) {
	return ApplyPageMiddleware(async function ({ req, res, query }) {
		const articlePath = query?.path ? `/${query.path.join("/")}` : undefined;
		query.l = localizer.extract(articlePath);
		const ctx = await this.app.contextFactory.fromNode({ req, res, query });

		const data = await this.commands.page.getPageData.do({
			path: articlePath,
			ctx,
		});

		return {
			props: data,
		};
	})({ req, res, query });
}
