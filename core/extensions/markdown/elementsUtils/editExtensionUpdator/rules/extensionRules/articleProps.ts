import { ArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getArticlePropsRule = (articleProps: ArticleProps): ExtensionUpdaterRules => {
	const filterNames = ["selectionMenu"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { articleProps },
	};
};

export default getArticlePropsRule;
