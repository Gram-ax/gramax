import ArticleLinks from "../../properties/components/Helpers/ArticleLinks";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import ShareAction from "@ext/catalog/actions/share/components/ShareAction";

interface LinksArticleActionsProps {
	itemLink: ItemLink;
}

export const LinksArticleActions = (props: LinksArticleActionsProps) => {
	const { itemLink } = props;
	if (!itemLink) return null;

	return (
		<>
			<ShareAction path={itemLink.pathname} isArticle />
			<ArticleLinks itemRefPath={itemLink.ref.path} />
		</>
	);
};
