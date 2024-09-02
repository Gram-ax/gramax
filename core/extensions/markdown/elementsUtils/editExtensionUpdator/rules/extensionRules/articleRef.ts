import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getArticleRefRule = (articleRef: ArticleRefService): ExtensionUpdaterRules => {
	const filterNames = ["DragScroller"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { articleRef },
	};
};

export default getArticleRefRule;
