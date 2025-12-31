import { FormEvent, memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Command, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandSeparator } from "@ui-kit/Command";
import styled from "@emotion/styled";
import type LinkItem from "@ext/article/LinkCreator/models/LinkItem";
import { Icon } from "@ui-kit/Icon";
import { LinkHeadings } from "./LinkHeadings";
import { SearchSelectOption } from "@ui-kit/SearchSelect";
import { useApi } from "@core-ui/hooks/useApi";
import t from "@ext/localization/locale/translate";
import { useExternalLink } from "@core-ui/hooks/useExternalLink";
import { LinkMenuMode } from "./LinkMenu";
import { IconButton } from "@ui-kit/Button";
import { useCatalogPropsStore } from "@core-ui/stores/CatalogPropsStore/CatalogPropsStore.provider";
import { CatalogSummary } from "@ext/workspace/UnintializedWorkspace";
import Workspace from "@core-ui/ContextServices/Workspace";
import { Loader } from "@ui-kit/Loader";
import { useLazySearchList } from "@core-ui/hooks/useLazySearchList";
import { LoadMoreTrigger } from "@ui-kit/LoadMoreTrigger";
import useWatch from "@core-ui/hooks/useWatch";
import { TextOverflowTooltip } from "@ui-kit/Tooltip";
import { useMediaQuery } from "@mui/material";
import { cssMedia } from "@core-ui/utils/cssUtils";
import { cn } from "@core-ui/utils/cn";

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

export const filterBySearch = (searchValue: string, optionLabel: string): boolean => {
	if (searchValue === "") return true;
	const cleanedSearchValue = searchValue.split("#")[0];
	return cleanedSearchValue === "" || optionLabel.toLowerCase().includes(cleanedSearchValue.toLowerCase());
};

const LinkItemComponent = ({ option, icon, depth, onUpdate }: LinkItemOption) => {
	return (
		<CommandItem
			key={option.value}
			value={`${option.value}`}
			onSelect={() => onUpdate(option.relativePath, option.pathname)}
			className="px-2 py-1 pr-1"
		>
			<div
				className="flex items-center gap-2 overflow-hidden"
				style={{ paddingLeft: `calc((0.5rem + 0.875rem) * ${depth})` }}
			>
				<Icon icon={icon} className="w-3.5 h-3.5" />
				<TextOverflowTooltip className="truncate whitespace-nowrap text-xs">{option.label}</TextOverflowTooltip>
			</div>
			<LinkHeadings linkItem={option} onUpdate={onUpdate} />
		</CommandItem>
	);
};

const CommandItemLoader = () => {
	return (
		<CommandItem disabled className="px-2 py-1">
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
				ref={inputRef}
				className="flex h-9 w-full rounded-md bg-transparent py-1 pl-1 text-sm outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-50 text-xs"
				type="text"
				placeholder={isSearchCatalogs ? `${t("list.search-catalogs")}...` : `${t("list.search-articles")}...`}
				value={value}
				onInput={onValueChange}
			/>
			<IconButton
				icon="x"
				onPointerDown={() => setMode("view")}
				size="lg"
				className="h-7 w-7 rounded-sm shadow-none"
				iconClassName="flex-shrink-0"
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
	}, [catalogName]);

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

	return (
		<>
			<CommandGroup
				heading={isCurrentCatalog ? t("editor.link.current-catalog") : t("editor.link.other-catalogs")}
				style={{ maxHeight: "11rem" }}
				className="overflow-y-auto text-xs"
			>
				{!isLoading
					? visibleOptions.map((option) => (
							<LinkItemComponent
								key={option.value}
								option={option}
								icon={option.type === "article" ? "file" : "folder"}
								depth={searchValue.length ? 0 : option.breadcrumb?.length}
								onUpdate={onUpdate}
							/>
					  ))
					: Array.from({ length: 4 }).map((_, index) => <CommandItemLoader key={index} />)}
				<LoadMoreTrigger onLoad={handleLoadMore} hasMore={hasMoreItems} />
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
	}, []);

	const allOptions = useMemo(() => {
		return options
			.filter((option) => filterBySearch(searchValue, option.title))
			.map((option, index) => (
				<CommandItem
					key={option.name + index}
					value={option.name + index}
					className="px-2 py-1"
					onSelect={() => setCatalogName(option.name)}
				>
					<span className="text-xs whitespace-nowrap truncate">{option.title}</span>
				</CommandItem>
			));
	}, [options, searchValue]);

	return (
		<CommandGroup
			heading={t("editor.link.catalogs")}
			style={{ maxHeight: "11rem" }}
			className="overflow-y-auto text-xs"
		>
			{!isLoading ? allOptions : Array.from({ length: 4 }).map((_, index) => <CommandItemLoader key={index} />)}
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
			role="link-toolbar"
			shouldFilter={false}
			className={cn("rounded-lg lg:shadow-hard-base", isMobile && "mobile")}
		>
			<CommandInput
				value={value}
				onValueChange={onValueChange}
				setMode={changeMode}
				isSearchCatalogs={!isCurrentCatalog}
			/>
			<CommandList>
				<CommandEmpty>{t("list.no-results-found")}</CommandEmpty>
				<CommandItem value="-" className="hidden" />
				{!isExternalLink && selectedCatalogName && (
					<ChooseArticles
						catalogName={selectedCatalogName}
						searchValue={value}
						onUpdate={onUpdate}
						isCurrentCatalog={isCurrentCatalog}
					/>
				)}
				{!isExternalLink && !selectedCatalogName && (
					<ChooseCatalog
						searchValue={value}
						catalogName={selectedCatalogName}
						setCatalogName={setSelectedCatalogName}
					/>
				)}
				{!isExternalLink && selectedCatalogName && (
					<>
						<CommandSeparator />
						<div className="p-1">
							<CommandItem
								className="px-2 py-1 h-7"
								value="other-catalogs"
								onSelect={() => {
									setSelectedCatalogName(null);
									setValue("");
								}}
							>
								<div className="flex items-center gap-2">
									<Icon icon="folders" className="w-3.5 h-3.5" />
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
								<Icon icon="globe" className="w-3.5 h-3.5" />
								<span className="truncate whitespace-nowrap text-xs">{externalLink}</span>
							</div>
						</CommandItem>
					</div>
				)}
			</CommandList>
		</StyledCommand>
	);
});
