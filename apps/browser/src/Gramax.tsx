import { type Environment, getExecutingEnvironment } from "@app/resolveModule/env";
import ContextProviders from "@components/ContextProviders";
import HomePage from "@components/HomePage/HomePage";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import type PageDataContext from "@core/Context/PageDataContext";
import type { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import { type Dispatch, memo, type SetStateAction } from "react";

export interface GramaxData {
	data: HomePageData | ArticlePageData;
	context: PageDataContext;
	path: string;
}

interface GramaxProps {
	data: GramaxData;
	refresh?: () => Promise<void>;
	setData: Dispatch<SetStateAction<GramaxData>>;
	platform?: Environment;
}

const Gramax = ({ data, refresh, setData, platform }: GramaxProps) => {
	return (
		<ContextProviders
			clearData={() => {
				const prev = data;
				setTimeout(() => setData((data) => (data == prev ? null : data)), 500);
			}}
			pageProps={data as any}
			platform={platform || getExecutingEnvironment()}
			refreshPage={refresh}
		>
			<>
				<ErrorBoundary context={data.context}>
					{data.context.isArticle ? (
						<CatalogComponent data={data.data as ArticlePageData}>
							<ArticleViewContainer
								data={data.data as ArticlePageData}
								key={(data.data as ArticlePageData)?.articleProps?.ref?.path}
							/>
						</CatalogComponent>
					) : (
						<HomePage data={data.data as HomePageData} />
					)}
				</ErrorBoundary>
			</>
		</ContextProviders>
	);
};

export default memo(Gramax, (prev, next) => {
	return prev.data === next.data;
});
