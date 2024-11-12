import AdminLoginLayout from "@ext/admin/AdminLayout";
import localizer from "@ext/localization/core/Localizer";
import Head from "next/head";
import { useRouter } from "next/router";
import { ApplyPageMiddleware } from "../logic/Api/ApplyMiddleware";

export default () => {
	const router = useRouter();
	return (
		<>
			<Head>
				<title>Admin</title>
			</Head>
			<AdminLoginLayout redirectCallback={() => router.push("/")} />
		</>
	);
};

export function getServerSideProps({ req, res, query }) {
	return ApplyPageMiddleware(async function ({ req, res, query }) {
		const articlePath = query?.path ? "/" + query.path.join("/") : undefined;
		query.l = localizer.extract(articlePath);
		const ctx = await this.app.contextFactory.from(req, res, query);

		const data = await this.commands.page.getPageData.do({
			path: articlePath,
			ctx,
		});

		return {
			props: data,
		};
	})({ req, res, query });
}
