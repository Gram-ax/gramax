// biome-ignore lint/style/noRestrictedImports: CSS-only import for theme variables
import "ics-ui-kit/theme.css";
import "../../../core/ui-kit/index.css";
import "../../../core/styles/main.css";
import "../../../core/styles/chain-icon.css";
import ContextProviders from "@components/ContextProviders";
import OpenGraph from "@components/OpenGraph/OpenGraph";
import type { PageProps } from "@components/Pages/models/Pages";
import getPageTitle from "@core-ui/getPageTitle";
import { defaultRefreshPage } from "@core-ui/utils/initGlobalFuncs";
import { NotificationsInit } from "@ext/enterprise/notifications/NotificationsInit";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import { useApplyTheme } from "@ext/Theme/utils";
import { setFeatureList } from "@ext/toggleFeatures/features";
import { usePluginEvent } from "@plugins/api/events";
import { Toaster } from "@ui-kit/Toast";
import { TooltipProvider } from "@ui-kit/Tooltip";
import Error from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect } from "react";

type NextPageProps = PageProps & {
	error?: number;
};

export default function App({
	Component,
	pageProps,
}: {
	// biome-ignore lint/suspicious/noExplicitAny: for compatibility with Next.js App type
	Component: any;
	pageProps: NextPageProps;
}) {
	useEffect(() => {
		if (pageProps.context?.features) setFeatureList(pageProps.context.features);
	}, [pageProps.context?.features]);

	const router = useRouter();

	useApplyTheme();
	const basePath = pageProps?.context?.conf?.basePath ?? "";

	usePluginEvent("app:open", { ...pageProps, path: router.asPath });
	usePluginEvent("app:close");

	if (pageProps.error) return <Error statusCode={pageProps.error} />;

	const isArticle = pageProps?.page === "article";
	const isReadonlyArticle = isArticle && pageProps.data.mode === "read";
	const iconPath = `${basePath}/favicon.ico`;

	return (
		<>
			<Head>
				<title>{getPageTitle(pageProps)}</title>
				<link href={iconPath} rel="icon" />
				{isArticle && isReadonlyArticle && (
					<OpenGraph domain={pageProps.context.domain} openGraphData={pageProps.data.openGraphData} />
				)}
				{isArticle && pageProps?.data?.articleProps?.description && (
					<meta content={pageProps.data.articleProps.description} name="description" />
				)}
			</Head>
			<TooltipProvider>
				<Toaster />
				<ContextProviders pageProps={pageProps} platform="next" refreshPage={defaultRefreshPage}>
					<>
						<NotificationsInit pageProps={pageProps} />
						<ErrorBoundary context={pageProps.context}>
							<Component {...pageProps} />
						</ErrorBoundary>
					</>
				</ContextProviders>
			</TooltipProvider>
		</>
	);
}
