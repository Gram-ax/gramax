import ShareAction from "@ext/catalog/actions/share/components/ShareAction";
import { ItemLink } from "@ext/navigation/NavigationLinks";
import ArticleLinks from "../../properties/components/Helpers/ArticleLinks";

interface LinksArticleActionsProps {
	itemLink: ItemLink;
}

export const LinksArticleActions = (props: LinksArticleActionsProps) => {
	const { itemLink } = props;
	if (!itemLink) return null;

	return (
		<>
			<ShareAction isArticle path={itemLink.pathname} />
			<ArticleLinks itemRefPath={itemLink.ref.path} />
		</>
	);
};
