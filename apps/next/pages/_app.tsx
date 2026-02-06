import "../../../core/styles/main.css";
import "../../../core/styles/chain-icon.css";

import { initFrontendModules } from "@app/resolveModule/frontend";
import ContextProviders from "@components/ContextProviders";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import OpenGraph from "@components/OpenGraph";
import type PageDataContext from "@core/Context/PageDataContext";
import type { ArticlePageData, HomePageData, OpenGraphData } from "@core/SitePresenter/SitePresenter";
import Language from "@core-ui/ContextServices/Language";
import getPageTitle from "@core-ui/getPageTitle";
import { defaultRefreshPage } from "@core-ui/utils/initGlobalFuncs";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import { setFeatureList } from "@ext/toggleFeatures/features";
import { usePluginEvent } from "@plugins/api/events";
import { usePluginLoader } from "@plugins/hooks/usePluginLoader";
import { Toaster } from "@ui-kit/Toast";
import { TooltipProvider } from "@ui-kit/Tooltip";
import Error from "next/error";
import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useLayoutEffect, useState } from "react";

const useInitModules = () => {
	const [isInit, setIsInit] = useState(false);

	useLayoutEffect(() => {
		initFrontendModules()
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
				<link href={iconPath} rel="icon" />
				{isArticle && <OpenGraph openGraphData={pageProps.openGraphData} />}
			</Head>
			<Language.Init>
				<TooltipProvider>
					<Toaster />
					<ContextProviders pageProps={pageProps} platform="next" refreshPage={defaultRefreshPage}>
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
