import "../../../core/styles/ProseMirror.css";
import "../../../core/styles/chain-icon.css";
import "../../../core/styles/admonition.css";
import "../../../core/styles/article-alfabeta.css";
import "../../../core/styles/article.css";
import "../../../core/styles/global.css";
import "../../../core/styles/swagger-ui-theme.css";

import ContextProviders from "@components/ContextProviders";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import OpenGraph from "@components/OpenGraph";
import Language from "@core-ui/ContextServices/Language";
import { defaultRefreshPage } from "@core-ui/ContextServices/RefreshPageContext";
import getPageTitle from "@core-ui/getPageTitle";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData, OpenGraphData } from "@core/SitePresenter/SitePresenter";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import Error from "next/error";
import Head from "next/head";

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
	if (pageProps.error) return <Error statusCode={pageProps.error} />;

	const isArticle = pageProps?.context?.isArticle;

	return (
		<>
			<Head>
				<title>{getPageTitle(isArticle, pageProps.data)}</title>
			</Head>
			<Language.Provider>
				<ContextProviders pageProps={pageProps} refreshPage={defaultRefreshPage}>
					<ErrorBoundary context={pageProps.context}>
						{isArticle ? (
							<>
								<OpenGraph openGraphData={pageProps.openGraphData} />
								<CatalogComponent data={pageProps.data}>
									<Component {...pageProps} />
								</CatalogComponent>
							</>
						) : (
							<Component {...pageProps} />
						)}
					</ErrorBoundary>
				</ContextProviders>
			</Language.Provider>
		</>
	);
}
