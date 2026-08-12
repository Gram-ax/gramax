import Icon from "@components/Atoms/Icon";
import NavigationTabsService from "@components/Layouts/LeftNavigationTabs/NavigationTabsService";
import { LeftNavigationTab } from "@components/Layouts/StatusBar/Extensions/ArticleStatusBar/ArticleStatusBar";
import {
	type RevisionArticleFilter,
	useRevisionCatalogStore,
} from "@ext/git/actions/Revisions/logic/store/RevisionCatalogStore";
import t from "@ext/localization/locale/translate";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { DropdownMenuItem } from "@ui-kit/Dropdown";
import { useCallback } from "react";

export const ArticleRevisionTrigger = ({ itemLink }: { itemLink: ItemLink }) => {
	const { filter, setFilter } = useRevisionCatalogStore((state) => {
		return { filter: state.filter, setFilter: state.setFilter };
	});

	const openArticleHistory = useCallback(
		(article: RevisionArticleFilter) => {
			const existing = filter?.articles?.find((a) => a.path === article.path);

			if (!existing) setFilter({ ...filter, articles: [...(filter?.articles || []), article] });
			NavigationTabsService.setBottom(LeftNavigationTab.CatalogRevisions);
		},
		[filter, setFilter],
	);

	return (
		<DropdownMenuItem
			onSelect={() =>
				openArticleHistory({
					path: itemLink.ref.path.split("/").slice(1).join("/"),
					name: itemLink.title,
					pathname: itemLink.pathname,
				})
			}
		>
			<Icon code="history" />
			{t("git.history.button")}
		</DropdownMenuItem>
	);
};
