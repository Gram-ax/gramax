import BoxResizeWrapper from "@components/Atoms/BoxResizeWrapper";
import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import ActionButton from "@components/controls/HoverController/ActionButton";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { SortState } from "@ext/markdown/elements/table/edit/model/tableTypes";
import { useVirtualizer } from "@tanstack/react-virtual";
import { CheckboxField, type CheckedState } from "@ui-kit/Checkbox";
import { Command, CommandItem, CommandList } from "@ui-kit/Command";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui-kit/Dropdown";
import { Icon } from "@ui-kit/Icon";
import { SearchSelectInput } from "@ui-kit/SearchSelect";
import { ToggleGroup, ToggleGroupItem } from "@ui-kit/ToggleGroup";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@ui-kit/Tooltip";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

interface FilterButtonProps {
	columnValues: string[];
	filteredValues: string[];
	handleFilterChange: (excluded: string[]) => void;
	handleSortChange: (sortState: SortState) => void;
	sort: SortState;
	canSort: boolean;
}

const Icons: Record<SortState, IconCode> = {
	asc: "arrow-up-narrow-wide",
	desc: "arrow-down-wide-narrow",
};

const FILTER_VALUE_ITEM_HEIGHT = 32;
const FILTER_VALUE_LIST_HEIGHT_OFFSET = 210;

const CommandCheckboxField = (props: React.ComponentProps<typeof CheckboxField>) => {
	const { className, ...other } = props;
	return (
		<CheckboxField
			{...other}
			className={cn(
				"w-full font-normal",
				"[&>*]:max-w-[calc(100%-12px-16px)]",
				"[&_div:has(>label)]:h-auto",
				"[&_div:has(>label)_label]:inline-block",
				"[&_div:has(>label)_label]:overflow-hidden",
				"[&_div:has(>label)_label]:whitespace-nowrap",
				"[&_div:has(>label)_label]:text-ellipsis",
				"[&_div:has(>label)_label]:leading-5",
				"[&_div:has(>label)_label]:h-auto",
				"[&_div:has(>label)_label]:font-inherit",
				className,
			)}
		/>
	);
};

const FilterAndSortDropdownMenuLabel = ({ children }: { children: ReactNode }) => {
	return <DropdownMenuLabel className={cn("text-xs", "font-normal", "text-muted")}>{children}</DropdownMenuLabel>;
};

const FilterAndSortButton = (props: FilterButtonProps) => {
	const { columnValues = [], filteredValues = [], handleFilterChange, handleSortChange, sort, canSort } = props;

	const [height, setHeight] = useState(478);
	const [width, setWidth] = useState(267);
	const [searchQuery, setSearchQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);
	const emptyValueLabel = t("properties.empty");

	const sortedColumnValues = useMemo(
		() => [...columnValues].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
		[columnValues],
	);

	const filteredColumnValues = useMemo(() => {
		const normalizedSearch = searchQuery.trim().toLowerCase();
		if (!normalizedSearch) return sortedColumnValues;

		return sortedColumnValues.filter((value) =>
			(value || emptyValueLabel).toLowerCase().includes(normalizedSearch),
		);
	}, [emptyValueLabel, searchQuery, sortedColumnValues]);

	const maxFilterListHeight = Math.max(0, height - FILTER_VALUE_LIST_HEIGHT_OFFSET);

	const virtualizer = useVirtualizer({
		count: filteredColumnValues.length,
		enabled: isOpen,
		estimateSize: () => FILTER_VALUE_ITEM_HEIGHT,
		getScrollElement: () => scrollRef.current,
		initialRect: { height: maxFilterListHeight, width },
		overscan: 5,
	});

	const totalListHeight = virtualizer.getTotalSize();
	const filterListHeight = Math.min(totalListHeight, maxFilterListHeight);

	useEffect(() => {
		if (!isOpen || filterListHeight <= 0 || filteredColumnValues.length === 0) return;

		const frame = requestAnimationFrame(() => virtualizer.measure());
		return () => cancelAnimationFrame(frame);
	}, [filterListHeight, filteredColumnValues.length, isOpen, virtualizer]);

	const onSearchQueryChange = useCallback((value: string) => {
		setSearchQuery(value);
		scrollRef.current?.scrollTo({ top: 0 });
	}, []);

	const onResizeEnd = useCallback((event: MouseEvent) => {
		const wrapper = (event.target as HTMLDivElement)?.parentElement?.parentElement;
		if (!wrapper) return;

		const width = wrapper.clientWidth;
		const height = wrapper.clientHeight;

		setWidth(width);
		setHeight(height);
	}, []);

	const filtered = filteredValues.length || sort;
	const icon = filtered ? "funnel" : "funnel-plus";

	const checkedState: CheckedState = useMemo(() => {
		if (filteredValues.length === 0) return true;
		if (filteredValues.length === columnValues.length) return false;
		return "indeterminate";
	}, [columnValues, filteredValues]);

	const onCheckedChange = useCallback(
		(value: string) => {
			const next = filteredValues.includes(value)
				? filteredValues.filter((v) => v !== value)
				: [...filteredValues, value];
			handleFilterChange(next);
		},
		[filteredValues, handleFilterChange],
	);

	const onCheckAll = useCallback(() => {
		const next = filteredValues.length === 0 ? [...columnValues] : [];
		handleFilterChange(next);
	}, [filteredValues, handleFilterChange, columnValues]);

	const toggleGroup = (
		<ToggleGroup
			className="flex-col gap-0"
			defaultValue={sort}
			disabled={!canSort}
			onValueChange={handleSortChange}
			type="single"
		>
			{Object.values(SortState).map((v: SortState) => (
				<ToggleGroupItem
					className={cn(
						"w-full justify-between p-2 h-8",
						`[&[data-state="off"]>svg]:hidden [&[data-state="on"]]:bg-transparent`,
					)}
					key={v}
					value={v}
				>
					<div className={cn("flex gap-2 font-normal")}>
						<Icon icon={Icons[v]}></Icon>
						{t(`editor.table.sort.${v}`)}
					</div>
					<Icon icon="check"></Icon>
				</ToggleGroupItem>
			))}
		</ToggleGroup>
	);

	return (
		<DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
			<DropdownMenuTrigger asChild>
				<div
					className={cn(
						"button-container",
						"absolute right-0 bottom-0 z-[1] opacity-0 transition-opacity duration-200 ease-in-out",
						(isOpen || filtered) && "opacity-100",
						"hover:opacity-100",
					)}
				>
					<ActionButton icon={icon} tooltipText={""} />
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start">
				<BoxResizeWrapper
					maxHeight={window.innerHeight * 0.8}
					maxWidth={window.innerWidth * 0.5}
					minHeight={window.innerHeight * 0.06}
					minWidth={window.innerWidth * 0.1}
					onResizeEnd={onResizeEnd}
					style={{ height, width }}
				>
					<div className="grid h-full min-h-0 grid-rows-[auto_auto_auto_auto_minmax(0,1fr)]">
						<FilterAndSortDropdownMenuLabel>{t("properties.view.order-by")}</FilterAndSortDropdownMenuLabel>
						{canSort ? (
							toggleGroup
						) : (
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>{toggleGroup}</TooltipTrigger>
									<TooltipContent>
										<p className="max-w-xs">{t("editor.table.sort.not-available")}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						)}
						<DropdownMenuSeparator />
						<FilterAndSortDropdownMenuLabel>{t("properties.view.filter")}</FilterAndSortDropdownMenuLabel>
						<Command className="!shadow-none border-none h-full min-h-0" shouldFilter={false}>
							<SearchSelectInput
								onValueChange={onSearchQueryChange}
								placeholder={t("find2")}
								value={searchQuery}
							/>
							<div className="flex min-h-0 flex-1 flex-col p-1">
								<CommandItem forceMount key="*">
									<CommandCheckboxField
										checked={checkedState}
										label={t("properties.select-all")}
										onCheckedChange={onCheckAll}
									/>
								</CommandItem>
								<CommandList className="min-h-0 flex-1 !max-h-none overflow-hidden">
									<div ref={scrollRef} style={{ height: filterListHeight, overflowY: "auto" }}>
										<div style={{ height: totalListHeight, position: "relative" }}>
											{virtualizer.getVirtualItems().map((virtualItem) => {
												const value = filteredColumnValues[virtualItem.index];

												return (
													<div
														key={`v-${value}-${virtualItem.index}`}
														style={{
															height: virtualItem.size,
															position: "absolute",
															top: virtualItem.start,
															width: "100%",
														}}
													>
														<CommandItem title={value} value={value}>
															<CommandCheckboxField
																checked={!filteredValues.includes(value)}
																className={!value && "[&_label]:text-muted"}
																label={value || emptyValueLabel}
																onCheckedChange={() => onCheckedChange(value)}
															/>
														</CommandItem>
													</div>
												);
											})}
										</div>
									</div>
								</CommandList>
							</div>
						</Command>
					</div>
				</BoxResizeWrapper>
			</DropdownMenuContent>
		</DropdownMenu>
	);
};

export default FilterAndSortButton;
