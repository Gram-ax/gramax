import Workspace from "@core-ui/ContextServices/Workspace";
import { useApi } from "@core-ui/hooks/useApi";
import useWatch from "@core-ui/hooks/useWatch";
import { useArticlePropsStore } from "@core-ui/stores/ArticlePropsStore/ArticlePropsStore.provider";
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
import { useVirtualizer } from "@tanstack/react-virtual";
import { CommandGroup, CommandItem } from "@ui-kit/Command";
import { useEffect, useId, useMemo, useRef, useState } from "react";

interface LinkMenuCatalogChooserProps {
	searchValue: string;
	catalogName: string;
	setCatalogName: (catalogName: string) => void;
}

interface LinkMenuArticleChooserProps extends Omit<LinkMenuItemProps, "option" | "icon" | "depth"> {
	searchValue: string;
	isCurrentCatalog: boolean;
	catalogName: string;
	onCurrentOptionValue?: (value: string) => void;
}

type VirtualRow =
	| { kind: "breadcrumb"; key: string; breadcrumb: string[] }
	| { kind: "item"; key: string; option: ItemLinkOption };

const ITEM_HEIGHT = 28;
const BREADCRUMB_HEIGHT = 28;
const MAX_HEIGHT = 176; // 11rem

export const LinkMenuArticleChooser = (props: LinkMenuArticleChooserProps) => {
	const { searchValue, onUpdate, isCurrentCatalog, catalogName, onCurrentOptionValue } = props;
	const [options, setOptions] = useState<ItemLinkOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const id = useId();
	const scrollRef = useRef<HTMLDivElement>(null);
	const currentPathname = useArticlePropsStore((s) => `/${s.data?.pathname}`);

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
				res.map((item) => ({
					label: item.title,
					value: item.pathname + id,
					...item,
				})),
			);
		})();
	}, []);

	const filteredOptions = useMemo(() => {
		if (!searchValue) return options;
		return options
			.map((option) => ({
				option,
				score: filterItems({ label: option.label, pathname: option.pathname.split("/").pop() }, searchValue)
					? 1
					: 0,
			}))
			.filter(({ score }) => score > 0)
			.map(({ option }) => option);
	}, [options, searchValue]);

	const rows = useMemo<VirtualRow[]>(() => {
		if (!searchValue) return filteredOptions.map((option) => ({ kind: "item", key: option.value, option }));

		const result: VirtualRow[] = [];
		const seenBreadcrumbs = new Set<string>();

		for (const option of filteredOptions) {
			if (option.breadcrumb?.length > 0) {
				const breadcrumbKey = option.breadcrumb.join("/");
				if (!seenBreadcrumbs.has(breadcrumbKey)) {
					seenBreadcrumbs.add(breadcrumbKey);
					result.push({ kind: "breadcrumb", key: `bc:${breadcrumbKey}`, breadcrumb: option.breadcrumb });
				}
			}
			result.push({ kind: "item", key: option.value, option });
		}
		return result;
	}, [filteredOptions, searchValue]);

	const virtualizer = useVirtualizer({
		count: rows.length,
		getScrollElement: () => scrollRef.current,
		estimateSize: (index) => (rows[index].kind === "breadcrumb" ? BREADCRUMB_HEIGHT : ITEM_HEIGHT),
		overscan: 5,
	});

	useWatch(() => {
		virtualizer.scrollToIndex(0);
	}, [searchValue]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll to element only when options loaded
	useEffect(() => {
		const option = filteredOptions.find((option) => option.pathname === currentPathname);
		if (!option) return;

		onCurrentOptionValue?.(option.value);
		virtualizer.scrollToIndex(filteredOptions.indexOf(option), { align: "start" });
	}, [options]);

	const totalHeight = virtualizer.getTotalSize();
	const containerHeight = Math.min(totalHeight, MAX_HEIGHT);

	return (
		<CommandGroup
			className="text-xs"
			heading={isCurrentCatalog ? t("editor.link.current-catalog") : t("editor.link.other-catalogs")}
		>
			{!isLoading ? (
				<div ref={scrollRef} style={{ height: containerHeight, overflowY: "auto" }}>
					<div style={{ height: totalHeight, position: "relative" }}>
						{virtualizer.getVirtualItems().map((virtualItem) => {
							const row = rows[virtualItem.index];
							return (
								<div
									key={row.key}
									style={{
										position: "absolute",
										top: virtualItem.start,
										left: 0,
										width: "100%",
										height: virtualItem.size,
										overflow: "hidden",
									}}
								>
									{row.kind === "breadcrumb" ? (
										<LinkMenuBreadcrumb breadcrumb={row.breadcrumb} />
									) : (
										<LinkMenuItem
											depth={searchValue.length ? 0 : row.option.breadcrumb?.length}
											icon={row.option.type === "article" ? "file" : "folder"}
											onUpdate={onUpdate}
											option={row.option}
										/>
									)}
								</div>
							);
						})}
					</div>
				</div>
			) : (
				<LinkMenuLoader />
			)}
		</CommandGroup>
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
