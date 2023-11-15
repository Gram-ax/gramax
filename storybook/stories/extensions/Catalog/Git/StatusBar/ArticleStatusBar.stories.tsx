import ArticleStatusBarSrc from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar";
import mockApi from "../../../../../logic/api/mockApi";
import checkoutApi from "../BranchActions/checkoutApi";
import syncApiData from "../Sync/syncApiData";

const ArticleStatusBarData = {
	title: "DocReader/extensions/Catalog/Git/ArticleStatusBar",
	decorators: [
		(Story) => {
			return (
				<div style={{ display: "flex", alignItems: "flex-end", height: "100%", width: "300px" }}>
					<Story />
				</div>
			);
		},
	],
	parameters: {
		msw: mockApi([...checkoutApi, ...syncApiData, { path: "https://api.github.com/user", response: [] }]),
	},
};

export const ArticleStatusBar = () => {
	return <ArticleStatusBarSrc />;
};

export default ArticleStatusBarData;
