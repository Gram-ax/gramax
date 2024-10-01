import { ClientArticleProps } from "../../../../../../logic/SitePresenter/SitePresenter";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getArticlePropsRule = (articleProps: ClientArticleProps): ExtensionUpdaterRules => {
	const filterNames = ["selectionMenu", "copyArticles", "copyMsO"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { articleProps },
	};
};

export default getArticlePropsRule;
