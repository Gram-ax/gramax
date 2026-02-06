import Workspace from "@core-ui/ContextServices/Workspace";
import { useApi } from "@core-ui/hooks/useApi";
import { useExternalLink } from "@core-ui/hooks/useExternalLink";
import { useLazySearchList } from "@core-ui/hooks/useLazySearchList";
import useWatch from "@core-ui/hooks/useWatch";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { cn } from "@core-ui/utils/cn";
import { cssMedia } from "@core-ui/utils/cssUtils";
import styled from "@emotion/styled";
import type LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import t from "@ext/localization/locale/translate";
import type { CatalogSummary } from "@ext/workspace/UnintializedWorkspace";
import { useMediaQuery } from "@mui/material";
import { IconButton } from "@ui-kit/Button";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList, CommandSeparator } from "@ui-kit/Command";
import { Icon } from "@ui-kit/Icon";
import { Loader } from "@ui-kit/Loader";
import { LoadMoreTrigger } from "@ui-kit/LoadMoreTrigger";
import type { SearchSelectOption } from "@ui-kit/SearchSelect";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { type FormEvent, type HTMLAttributes, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LinkHeadings } from "./LinkHeadings";
import type { LinkMenuMode } from "./LinkMenu";

interface EditLinkMenuProps {
	catalogName: string;
	defaultValue: string;
	hasError: boolean;
	setMode: (mode: LinkMenuMode) => void;
	onDelete: () => void;
	onUpdate: (relativePath: string, newHref: string) => void;
}

interface LinkItemOption {
	option: ItemLinkOption;
	icon: string;
	depth: number;
	onUpdate: (relativePath: string, newHref: string) => void;
}

interface CommandInputProps {
	value: string;
	isSearchCatalogs: boolean;
	onValueChange: (event: FormEvent<HTMLInputElement>) => void;
	setMode: (mode: LinkMenuMode) => void;
}

interface ChooseCatalogProps {
	searchValue: string;
	catalogName: string;
	setCatalogName: (catalogName: string) => void;
}

interface ChooseArticlesProps extends Omit<LinkItemOption, "option" | "icon" | "depth"> {
	searchValue: string;
	isCurrentCatalog: boolean;
	catalogName: string;
}

type ItemLinkOption = Omit<SearchSelectOption, "value"> & LinkItem & { value: string };

const StyledCommand = styled(Command)`
	width: 18.75rem;
	max-height: min(18.75rem, 60vh);

	&.mobile {
		width: 100%;
	}
`;

const getLoaderItems = () => {
	return Array.from({ length: 4 }, (_, i) => ({ key: `loader-${i}` }));
};

export const filterBySearch = (searchValue: string, optionLabel: string): boolean => {
	if (searchValue === "") return true;
	const cleanedSearchValue = searchValue.split("#")[0];
	return cleanedSearchValue === "" || optionLabel.toLowerCase().includes(cleanedSearchValue.toLowerCase());
};

const LinkItemComponent = ({ option, icon, depth, onUpdate }: LinkItemOption) => {
	return (
		<CommandItem
			className="px-2 py-1 pr-1"
			key={option.value}
			onSelect={() => onUpdate(option.relativePath, option.pathname)}
			value={`${option.value}`}
		>
			<div
				className="flex items-center gap-2 overflow-hidden"
				style={{ paddingLeft: `calc((0.5rem + 0.875rem) * ${depth})` }}
			>
				<Icon className="w-3.5 h-3.5" icon={icon} />
				<TextOverflowTooltip className="truncate whitespace-nowrap text-xs">{option.label}</TextOverflowTooltip>
			</div>
			<LinkHeadings linkItem={option} onUpdate={onUpdate} />
		</CommandItem>
	);
};

const CommandLabel = (props: HTMLAttributes<HTMLDivElement>) => {
	const { children, className, ...rest } = props;
	return (
		<div className={cn("text-inverse-muted text-xs font-medium truncate", className)} {...rest}>
			{children}
		</div>
	);
};

const CommandBreadcrumb = (props: HTMLAttributes<HTMLDivElement> & { breadcrumb: string[] }) => {
	const { breadcrumb, children, className, ...rest } = props;

	const isLongBreadcrumb = breadcrumb.length > 2;
	const firstBreadcrumb = isLongBreadcrumb ? breadcrumb[0] : null;
	const lastBreadcrumb = isLongBreadcrumb ? breadcrumb[breadcrumb.length - 1] : null;

	return (
		<div
			className={cn("flex items-center gap-1 overflow-hidden max-w-full truncate py-1.5 pb-0.5 px-2", className)}
			{...rest}
		>
			{!isLongBreadcrumb &&
				breadcrumb.map((breadcrumb, index) => (
					<>
						{index > 0 && (
							<CommandLabel className="flex-shrink-0">
								<span>/</span>
							</CommandLabel>
						)}
						<CommandLabel className="inline-flex" key={breadcrumb}>
							<TextOverflowTooltip>{breadcrumb}</TextOverflowTooltip>
						</CommandLabel>
					</>
				))}

			{isLongBreadcrumb && lastBreadcrumb && (
				<>
					<CommandLabel className="flex-shrink-0">
						<span>{firstBreadcrumb}</span>
					</CommandLabel>
					<CommandLabel className="flex-shrink-0">
						<span>/</span>
					</CommandLabel>
					<CommandLabel className="flex-shrink-0">
						<span>...</span>
					</CommandLabel>
					<CommandLabel className="flex-shrink-0">
						<span>/</span>
					</CommandLabel>
					<CommandLabel className="inline-flex">
						<TextOverflowTooltip>{lastBreadcrumb}</TextOverflowTooltip>
					</CommandLabel>
				</>
			)}
			{children}
		</div>
	);
};

const CommandItemLoader = () => {
	return (
		<CommandItem className="px-2 py-1" disabled>
			<div className="flex items-center">
				<Loader className="w-3.5 h-3.5 text-inverse-primary-fg" />
				<span>{t("loading")}</span>
			</div>
		</CommandItem>
	);
};
const CommandInput = ({ value, onValueChange, setMode, isSearchCatalogs }: CommandInputProps) => {
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		requestAnimationFrame(() => {
			inputRef.current?.focus();
		});
	}, []);

	return (
		<div className="flex items-center border-b border-inverse-border pl-2 pr-1">
			<input
				className="flex h-9 w-full rounded-md bg-transparent py-1 pl-1 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 text-xs"
				onInput={onValueChange}
				placeholder={isSearchCatalogs ? `${t("list.search-catalogs")}...` : `${t("list.search-articles")}...`}
				ref={inputRef}
				type="text"
				value={value}
			/>
			<IconButton
				className="h-7 w-7 rounded-sm shadow-none"
				icon="x"
				iconClassName="flex-shrink-0"
				onPointerDown={() => setMode("view")}
				size="lg"
			/>
		</div>
	);
};

const ChooseArticles = (props: ChooseArticlesProps) => {
	const { searchValue, onUpdate, isCurrentCatalog, catalogName } = props;
	const [options, setOptions] = useState<ItemLinkOption[]>([]);
	const [isLoading, setIsLoading] = useState(false);

	const { call: getItemLinks } = useApi<LinkItem[]>({
		url: (api) => api.getLinkItems(catalogName),
		onStart: () => setIsLoading(true),
		onDone: () => setIsLoading(false),
	});

	useEffect(() => {
		void (async () => {
			const res = (await getItemLinks()) || [];
			setOptions(
				res.map((item, idx) => {
					return {
						label: item.title,
						value: item.title + idx,
						...item,
					};
				}),
			);
		})();
	}, [getItemLinks]);

	const { visibleOptions, hasMoreItems, handleLoadMore, handleSearchChange } = useLazySearchList<ItemLinkOption>({
		options,
		filter: (option, searchValue) => (filterBySearch(searchValue, option.label) ? 1 : 0),
		pageSize: 10,
		defaultValue: searchValue,
		value: searchValue,
	});

	useWatch(() => {
		handleSearchChange(searchValue);
	}, [searchValue]);

	const shouldVisibleBreadcrumb = !!searchValue;

	return (
		<>
			<CommandGroup
				className="overflow-y-auto text-xs"
				heading={isCurrentCatalog ? t("editor.link.current-catalog") : t("editor.link.other-catalogs")}
				style={{ maxHeight: "11rem" }}
			>
				{!isLoading
					? visibleOptions.map((option) => (
							<>
								{shouldVisibleBreadcrumb && option.breadcrumb?.length > 0 && (
									<CommandBreadcrumb breadcrumb={option.breadcrumb} />
								)}
								<LinkItemComponent
									depth={searchValue.length ? 0 : option.breadcrumb?.length}
									icon={option.type === "article" ? "file" : "folder"}
									key={option.value}
									onUpdate={onUpdate}
									option={option}
								/>
							</>
						))
					: getLoaderItems().map((item) => <CommandItemLoader key={item.key} />)}
				<LoadMoreTrigger hasMore={hasMoreItems} onLoad={handleLoadMore} />
			</CommandGroup>
		</>
	);
};

const ChooseCatalog = ({ searchValue, setCatalogName }: ChooseCatalogProps) => {
	const [options, setOptions] = useState<CatalogSummary[]>([]);
	const [isLoading, setIsLoading] = useState(false);

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

	useEffect(() => {
		void (async () => {
			const res = (await getCatalogList()) || [];
			setOptions(res);
		})();
	}, [getCatalogList]);

	const allOptions = useMemo(() => {
		return options
			.filter((option) => filterBySearch(searchValue, option.title))
			.map((option, index) => (
				<CommandItem
					className="px-2 py-1"
					key={option.name}
					onSelect={() => setCatalogName(option.name)}
					value={option.name + index}
				>
					<span className="text-xs whitespace-nowrap truncate">{option.title}</span>
				</CommandItem>
			));
	}, [options, searchValue, setCatalogName]);

	return (
		<CommandGroup
			className="overflow-y-auto text-xs"
			heading={t("editor.link.catalogs")}
			style={{ maxHeight: "11rem" }}
		>
			{!isLoading ? allOptions : getLoaderItems().map((item) => <CommandItemLoader key={item.key} />)}
		</CommandGroup>
	);
};

export const EditLinkMenu = memo((props: EditLinkMenuProps) => {
	const { defaultValue, catalogName: initialCatalogName, hasError, setMode, onDelete, onUpdate } = props;
	const isMobile = useMediaQuery(cssMedia.JSnarrow);
	const { catalogName } = useCatalogPropsStore((state) => {
		return {
			catalogName: state.data?.name,
		};
	}, "shallow");
	const [selectedCatalogName, setSelectedCatalogName] = useState<string>(initialCatalogName || catalogName);
	const [value, setValue] = useState(defaultValue);
	const [isExternalLink, externalLink, updateLink] = useExternalLink(value);
	const isCurrentCatalog = selectedCatalogName === catalogName;

	useEffect(() => {
		setValue(defaultValue);
	}, [defaultValue]);

	const onValueChange = useCallback(
		(event: FormEvent<HTMLInputElement>) => {
			const newValue = (event.target as HTMLInputElement).value;
			setValue(newValue);
			updateLink(newValue);
		},
		[updateLink],
	);

	const changeMode = useCallback(
		(mode: LinkMenuMode) => {
			setMode(mode);
			if (!defaultValue || !defaultValue.length || hasError) onDelete();
		},
		[setMode, onDelete, defaultValue, hasError],
	);

	return (
		<StyledCommand
			className={cn("rounded-lg lg:shadow-hard-base", isMobile && "mobile")}
			role="toolbar"
			shouldFilter={false}
		>
			<CommandInput
				isSearchCatalogs={!isCurrentCatalog}
				onValueChange={onValueChange}
				setMode={changeMode}
				value={value}
			/>
			<CommandList>
				<CommandEmpty>{t("list.no-results-found")}</CommandEmpty>
				<CommandItem className="hidden" value="-" />
				{!isExternalLink && selectedCatalogName && (
					<ChooseArticles
						catalogName={selectedCatalogName}
						isCurrentCatalog={isCurrentCatalog}
						onUpdate={onUpdate}
						searchValue={value}
					/>
				)}
				{!isExternalLink && !selectedCatalogName && (
					<ChooseCatalog
						catalogName={selectedCatalogName}
						searchValue={value}
						setCatalogName={setSelectedCatalogName}
					/>
				)}
				{!isExternalLink && selectedCatalogName && (
					<>
						<CommandSeparator />
						<div className="p-1">
							<CommandItem
								className="px-2 py-1 h-7"
								onSelect={() => {
									setSelectedCatalogName(null);
									setValue("");
								}}
								value="other-catalogs"
							>
								<div className="flex items-center gap-2">
									<Icon className="w-3.5 h-3.5" icon="folders" />
									<span className="text-xs whitespace-nowrap truncate">
										{t("editor.link.other-catalogs")}
									</span>
								</div>
							</CommandItem>
						</div>
					</>
				)}
				{isExternalLink && (
					<div className="p-1">
						<CommandItem
							className="px-2 py-1 overflow-hidden max-w-full"
							onSelect={() => onUpdate(externalLink, externalLink)}
						>
							<div className="flex items-center gap-2 truncate">
								<Icon className="w-3.5 h-3.5" icon="globe" />
								<span className="truncate whitespace-nowrap text-xs">{externalLink}</span>
							</div>
						</CommandItem>
					</div>
				)}
			</CommandList>
		</StyledCommand>
	);
});
