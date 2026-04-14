import Workspace from "@core-ui/ContextServices/Workspace";
import { useApi } from "@core-ui/hooks/useApi";
import { useLazySearchList } from "@core-ui/hooks/useLazySearchList";
import useWatch from "@core-ui/hooks/useWatch";
import type LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import t from "@ext/localization/locale/translate";
import { LinkMenuBreadcrumb } from "@ext/markdown/elements/link/edit/components/LinkMenu/EditLinkMenu/LinkMenuBreadcrumb";
import {
	type ItemLinkOption,
	LinkMenuItem,
	type LinkMenuItemProps,
} from "@ext/markdown/elements/link/edit/components/LinkMenu/EditLinkMenu/LinkMenuItem";
import { LinkMenuLoader } from "@ext/markdown/elements/link/edit/components/LinkMenu/EditLinkMenu/LinkMenuLoader";
import { filterItems } from "@ext/markdown/elements/link/edit/logic/filterItems";
import type { CatalogSummary } from "@ext/workspace/UnintializedWorkspace";
import { CommandGroup, CommandItem } from "@ui-kit/Command";
import { LoadMoreTrigger } from "@ui-kit/LoadMoreTrigger";
import { Fragment, useCallback, useEffect, useId, useMemo, useState } from "react";

interface LinkMenuCatalogChooserProps {
	searchValue: string;
	catalogName: string;
	setCatalogName: (catalogName: string) => void;
}

interface LinkMenuArticleChooserProps extends Omit<LinkMenuItemProps, "option" | "icon" | "depth"> {
	searchValue: string;
	isCurrentCatalog: boolean;
	catalogName: string;
}

export const LinkMenuArticleChooser = (props: LinkMenuArticleChooserProps) => {
	const { searchValue, onUpdate, isCurrentCatalog, catalogName } = props;
	const [options, setOptions] = useState<ItemLinkOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const id = useId();

	const { call: getItemLinks } = useApi<LinkItem[]>({
		url: (api) => api.getLinkItems(catalogName),
		onStart: () => setIsLoading(true),
		onDone: () => setIsLoading(false),
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		void (async () => {
			const res = (await getItemLinks()) || [];
			setOptions(
				res.map((item) => {
					return {
						label: item.title,
						value: item.pathname + id,
						...item,
					};
				}),
			);
		})();
	}, []);

	const filterFn = useCallback((option: ItemLinkOption, searchValue: string) => {
		return filterItems({ label: option.label, pathname: option.pathname.split("/").pop() }, searchValue) ? 1 : 0;
	}, []);

	const { visibleOptions, hasMoreItems, handleLoadMore, handleSearchChange } = useLazySearchList<ItemLinkOption>({
		options,
		filter: filterFn,
		pageSize: 10,
		defaultValue: searchValue,
		value: searchValue,
	});

	useWatch(() => {
		handleSearchChange(searchValue);
	}, [searchValue]);

	const shouldVisibleBreadcrumb = !!searchValue;

	const areBreadcrumbsEqual = useCallback((a: string[], b: string[]) => {
		if (a === b) return true;
		if (!a || !b || a.length !== b.length) return false;
		return a.every((item, i) => item === b[i]);
	}, []);

	return (
		<>
			<CommandGroup
				className="overflow-y-auto text-xs"
				heading={isCurrentCatalog ? t("editor.link.current-catalog") : t("editor.link.other-catalogs")}
				style={{ maxHeight: "11rem" }}
			>
				{!isLoading ? (
					visibleOptions.map((option, index) => {
						const prevBreadcrumb = visibleOptions[index - 1]?.breadcrumb;
						const isFirstWithThisBreadcrumb = !areBreadcrumbsEqual(option.breadcrumb, prevBreadcrumb);
						const showBreadcrumb =
							shouldVisibleBreadcrumb && option.breadcrumb?.length > 0 && isFirstWithThisBreadcrumb;

						return (
							<Fragment key={option.value}>
								{showBreadcrumb && <LinkMenuBreadcrumb breadcrumb={option.breadcrumb} />}
								<LinkMenuItem
									depth={searchValue.length ? 0 : option.breadcrumb?.length}
									icon={option.type === "article" ? "file" : "folder"}
									onUpdate={onUpdate}
									option={option}
								/>
							</Fragment>
						);
					})
				) : (
					<LinkMenuLoader />
				)}
				<LoadMoreTrigger hasMore={hasMoreItems} onLoad={handleLoadMore} />
			</CommandGroup>
		</>
	);
};

export const LinkMenuCatalogChooser = ({ searchValue, setCatalogName }: LinkMenuCatalogChooserProps) => {
	const [options, setOptions] = useState<CatalogSummary[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const id = useId();

	const workspace = Workspace.current();
	const workspacePath = workspace.path;

	const { call: getCatalogList } = useApi<{ catalogSummary: CatalogSummary[] }, CatalogSummary[]>({
		url: (api) => api.getWorkspaceCatalogList(workspacePath),
		onStart: () => setIsLoading(true),
		onDone: () => setIsLoading(false),
		map: (res) => res.catalogSummary ?? [],
		opts: {
			consumeError: false,
		},
	});

	// biome-ignore lint/correctness/useExhaustiveDependencies: expected
	useEffect(() => {
		void (async () => {
			const res = (await getCatalogList()) || [];
			setOptions(res);
		})();
	}, []);

	const allOptions = useMemo(() => {
		return options
			.filter((option) => filterItems({ label: option.title, pathname: option.name }, searchValue))
			.map((option) => (
				<CommandItem
					className="px-2 py-1"
					key={option.name}
					onSelect={() => setCatalogName(option.name)}
					value={option.name + id}
				>
					<span className="text-xs whitespace-nowrap truncate">{option.title}</span>
				</CommandItem>
			));
	}, [options, searchValue, setCatalogName, id]);

	return (
		<CommandGroup
			className="overflow-y-auto text-xs"
			heading={t("editor.link.catalogs")}
			style={{ maxHeight: "11rem" }}
		>
			{!isLoading ? allOptions : <LinkMenuLoader />}
		</CommandGroup>
	);
};
