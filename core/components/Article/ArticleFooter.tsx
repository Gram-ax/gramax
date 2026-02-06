import ArticleExtensions from "@components/Article/ArticleExtensions";
import { ContentEditorId } from "@ext/markdown/core/edit/components/ContentEditor";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import NextPrevious from "@ext/navigation/NextPrevious";

interface ArticleFooterProps {
	itemLinks: ItemLink[];
}

const ArticleFooter = ({ itemLinks }: ArticleFooterProps) => {
	return (
		<>
			<NextPrevious itemLinks={itemLinks} />
			<ArticleExtensions id={ContentEditorId} />
		</>
	);
};

export default ArticleFooter;
