import HomePage from "@components/HomePage/HomePage";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import LanguageService from "@core-ui/ContextServices/Language";
import ArticleViewContainer from "@core-ui/ContextServices/views/articleView/ArticleViewContainer";
import PageDataContext from "@core/Context/PageDataContext";
import { ArticlePageData, HomePageData } from "@core/SitePresenter/SitePresenter";
import { Router, useLocation } from "wouter";
import ForwardBackward, { useHistory } from "../../tauri/src/ForwardBackward";
import AppContext from "./AppContext";

const App = () => {
	const [, setLocation] = useLocation();
	const history = useHistory();

	return (
		<LanguageService.Provider>
			<AppContext>
				{(data: { data: HomePageData | ArticlePageData; context: PageDataContext; path: string }) => (
					<Router hook={() => [data.path, setLocation]}>
						<ForwardBackward {...history} setLocation={setLocation} location={data.path} />
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
		</LanguageService.Provider>
	);
};

export default App;
