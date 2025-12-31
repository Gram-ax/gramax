import "ics-ui-kit/styles.css";
import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/chain-icon.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import ContextProviders from "@components/ContextProviders";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import OpenGraph from "@components/OpenGraph";
import Language from "@core-ui/ContextServices/Language";
import getPageTitle from "@core-ui/getPageTitle";
import { defaultRefreshPage } from "@core-ui/utils/initGlobalFuncs";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData, OpenGraphData } from "@core/SitePresenter/SitePresenter";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import Error from "next/error";
import Head from "next/head";

import { initModules } from "@app/resolveModule/frontend";

import { setFeatureList } from "@ext/toggleFeatures/features";
import { PluginConfig } from "@plugins/index";
import { usePluginLoader } from "@plugins/hooks/usePluginLoader";
import { toast, Toaster } from "@ui-kit/Toast";
import { TooltipProvider } from "@ui-kit/Tooltip";
import { useEffect, useLayoutEffect, useState } from "react";
import { usePluginEvent } from "@plugins/api/events";
import { useRouter } from "next/router";

const useInitModules = () => {
	const [isInit, setIsInit] = useState(false);

	useLayoutEffect(() => {
		initModules()
			.then(() => setIsInit(true))
			.catch((e) => {
				console.error(e);
				setIsInit(true);
			});
	}, []);

	return isInit;
};

export default function App({
	Component,
	pageProps,
}: {
	Component: any;
	pageProps: {
		data: HomePageData & ArticlePageData;
		context: PageDataContext;
		error?: number;
		openGraphData?: OpenGraphData;
	};
}) {
	useEffect(() => {
		if (pageProps.context?.features) setFeatureList(pageProps.context.features);
	}, [pageProps.context?.features]);

	const isInit = useInitModules();
	const router = useRouter();

	const { pluginsLoaded } = usePluginLoader({
		basePath: pageProps.context?.conf?.basePath ?? "",
		workspacePath: pageProps.context?.workspace?.current,
		gesUrl: pageProps?.context?.conf?.enterprise?.gesUrl,
		enabled: isInit && !!pageProps.context,
	});

	usePluginEvent("app:open", { ...pageProps, path: router.asPath });
	usePluginEvent("app:close");
	if (!isInit || !pluginsLoaded) return null;

	if (pageProps.error) return <Error statusCode={pageProps.error} />;

	const isArticle = pageProps?.context?.isArticle;
	const iconPath = (pageProps?.context?.conf?.basePath ?? "") + "/favicon.ico";

	return (
		<>
			<Head>
				<title>{getPageTitle(isArticle, pageProps.data)}</title>
				<link rel="icon" href={iconPath} />
				{isArticle && <OpenGraph openGraphData={pageProps.openGraphData} />}
			</Head>
			<Language.Init>
				<TooltipProvider>
					<Toaster />
					<ContextProviders pageProps={pageProps} refreshPage={defaultRefreshPage} platform="next">
						<ErrorBoundary context={pageProps.context}>
							{isArticle ? (
								<>
									<CatalogComponent data={pageProps.data}>
										<Component {...pageProps} />
									</CatalogComponent>
								</>
							) : (
								<Component {...pageProps} />
							)}
						</ErrorBoundary>
					</ContextProviders>
				</TooltipProvider>
			</Language.Init>
		</>
	);
}
