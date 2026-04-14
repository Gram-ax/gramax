import Icon from "@components/Atoms/Icon";
import { useRouter } from "@core/Api/useRouter";
import Url from "@core-ui/ApiServices/Types/Url";
import SearchQueryService from "@core-ui/ContextServices/SearchQuery";
import t from "@ext/localization/locale/translate";
import type { ItemLink } from "@ext/navigation/NavigationLinks";
import { DropdownMenuItem } from "@ui-kit/Dropdown";

export const SearchInScopeTrigger = ({ itemLink, isCategory }: { itemLink: ItemLink; isCategory: boolean }) => {
	const router = useRouter();
	const { requestOpen } = SearchQueryService.value;
	const label = isCategory ? t("search.search-in-category") : t("search.search-in-article");

	return (
		<DropdownMenuItem
			onSelect={() => {
				requestOpen("article");
				router.setUrl(Url.from({ pathname: itemLink.pathname }));
			}}
		>
			<Icon code="search" />
			{label}
		</DropdownMenuItem>
	);
};
