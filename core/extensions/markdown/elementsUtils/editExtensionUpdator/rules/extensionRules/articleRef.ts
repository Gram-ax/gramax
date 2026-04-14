import type ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import type ExtensionUpdaterRules from "../ExtensionUpdaterRules";

const getArticleRefRule = (articleRef: ArticleRefService): ExtensionUpdaterRules => {
	const filterNames = ["DragScroller", "diff"];

	return {
		filter: (extension) => filterNames.includes(extension.name),
		options: { articleRef },
	};
};

export default getArticleRefRule;
