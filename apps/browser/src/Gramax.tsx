import { Environment, getExecutingEnvironment } from "@app/resolveModule/env";
import ContextProviders from "@components/ContextProviders";
import HomePage from "@components/HomePage/HomePage";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import React, { Dispatch, SetStateAction } from "react";
export interface GramaxProps {
	data: HomePageData | ArticlePageData;
	context: PageDataContext;
	path: string;
}

const Gramax = React.memo(
	({
		data,
		refresh,
		setData,
		platform,
	}: {
		data: GramaxProps;
		refresh?: () => Promise<void>;
		setData: Dispatch<SetStateAction<GramaxProps>>;
		platform?: Environment;
	}) => {
		return (
			<ContextProviders
				pageProps={data as any}
				refreshPage={refresh}
				clearData={() => {
					const prev = data;
					setTimeout(() => setData((data) => (data == prev ? null : data)), 500);
				}}
				platform={platform || getExecutingEnvironment()}
			>
				<>
					<ErrorBoundary context={data.context}>
						{data.context.isArticle ? (
							<CatalogComponent data={data.data as ArticlePageData}>
								<ArticleViewContainer key={(data.data as ArticlePageData)?.articleProps?.ref?.path} />
							</CatalogComponent>
						) : (
							<HomePage data={data.data as HomePageData} />
						)}
					</ErrorBoundary>
				</>
			</ContextProviders>
		);
	},
	(prev, next) => {
		return prev.data === next.data;
	},
);

export default Gramax;
