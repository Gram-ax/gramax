import HomePage from "@components/HomePage/HomePage";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import { Router, useLocation } from "wouter";
import AppContext from "./AppContext";

const App = () => {
	const [, setLocation] = useLocation();

	return (
		<AppContext>
			{(data: { data: HomePageData | ArticlePageData; context: PageDataContext; path: string }) => (
				<Router hook={() => [data.path, setLocation]}>
					{data.context.isArticle ? (
						<CatalogComponent data={data.data as ArticlePageData}>
							<ArticleViewContainer />
						</CatalogComponent>
					) : (
						<HomePage data={data.data as HomePageData} />
					)}
				</Router>
			)}
		</AppContext>
	);
};

export default App;
