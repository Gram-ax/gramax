import { Environment } from "@app/resolveModule/env";
import ContextProviders from "@components/ContextProviders";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import { defaultRefreshPage } from "@core-ui/utils/initGlobalFuncs";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData } from "@core/SitePresenter/SitePresenter";
import ErrorBoundary from "@ext/errorHandlers/client/components/ErrorBoundary";
import { Route, Routes } from "react-router-dom";

export interface AppProps {
	data: ArticlePageData;
	context: PageDataContext;
	platform: Environment;
	refreshPage?: () => void;
}

const App = ({ data, context, platform, refreshPage }: AppProps) => {
	return (
		<Routes>
			<Route
				path="*"
				element={
					<ContextProviders
						pageProps={{ data, context } as any}
						refreshPage={refreshPage || defaultRefreshPage}
						platform={platform}
					>
						<ErrorBoundary context={context}>
							<CatalogComponent data={data}>
								<ArticleViewContainer />
							</CatalogComponent>
						</ErrorBoundary>
					</ContextProviders>
				}
			/>
		</Routes>
	);
};

export default App;
