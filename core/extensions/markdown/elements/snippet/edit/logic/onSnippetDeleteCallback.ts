import { refreshPage } from "@core-ui/ContextServices/RefreshPageContext";

const onSnippetDeleteCallback = (
	usedInArticles: { pathname: string; title: string }[],
	currentArticlePathname: string,
) => {
	if (usedInArticles.map((a) => a.pathname).includes(currentArticlePathname)) {
		refreshPage();
	}
};

export default onSnippetDeleteCallback;
