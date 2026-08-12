import ArticleExtensions from "@components/Article/ArticleExtensions";
import { useItemLinks } from "@core-ui/stores/ItemLinksStore/ItemLinksStore.provider";
import NextPrevious from "@ext/navigation/NextPrevious";

const ArticleFooter = () => {
	const itemLinks = useItemLinks();
	return (
		<>
			<NextPrevious itemLinks={itemLinks} />
			<ArticleExtensions />
		</>
	);
};

export default ArticleFooter;
