import ArticleRefService from "@core-ui/ContextServices/ArticleRef";
import ArticleViewService from "@core-ui/ContextServices/views/articleView/ArticleViewService";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
import t from "@ext/localization/locale/translate";
import { GroupHeader } from "@ext/navigation/article/render/GroupHeader";
import TocScrollspy from "@ext/navigation/article/render/TocScrollspy";
import { TocList } from "@ext/navigation/article/render/TocTree";

const TableOfContents = ({ className }: { className?: string }) => {
	const items = useArticlePropsStore((state) => state.data?.tocItems);
	const articleElement = ArticleRefService.value;

	if (!items.length || !ArticleViewService.isDefaultView) return null;

	return (
		<>
			<GroupHeader className="mb-4" onClick={() => articleElement.current.scrollTo({ top: 0, behavior: "auto" })}>
				{t("in-article")}
			</GroupHeader>
			<TocScrollspy className={className} ref={articleElement}>
				<TocList items={items} level={0} />
			</TocScrollspy>
		</>
	);
};

export default TableOfContents;
