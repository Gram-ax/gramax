import ArticlePage from "@components/ArticlePage/ArticlePage";
import HomePage from "@components/HomePage/HomePage";
import CatalogComponent from "@components/Layouts/CatalogLayout/CatalogComponent";
import PageDataContext from "@core/Context/PageDataContext";
import { Route, Router, Switch, useLocation } from "wouter";
import AppContext from "./AppContext";

const App = () => {
	const [, setLocation] = useLocation();
	return (
		<AppContext>
			{(data: { data: any; context: PageDataContext; path: string }) => (
				<Router hook={() => [data.path, setLocation]}>
					<Switch>
						<Route path="/">
							<HomePage data={data.data} />
						</Route>
						<Route path="/:article*">
							<CatalogComponent data={data.data}>
								<ArticlePage data={data.data} />
							</CatalogComponent>
						</Route>
					</Switch>
				</Router>
			)}
		</AppContext>
	);
};

export default App;
