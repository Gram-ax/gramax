import ArticleExtensions from "@components/Article/ArticleExtensions";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import NextPrevious from "@ext/navigation/NextPrevious";

interface ArticleFooterProps {
	itemLinks: ItemLink[];
}

const ArticleFooter = ({ itemLinks }: ArticleFooterProps) => {
	return (
		<>
			<NextPrevious itemLinks={itemLinks} />
			<ArticleExtensions />
		</>
	);
};

export default ArticleFooter;
