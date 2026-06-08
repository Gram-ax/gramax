import BoxResizeWrapper from "@components/Atoms/BoxResizeWrapper";
import type { IconCode } from "@components/Atoms/Icon/LucideIcon";
import ActionButton from "@components/controls/HoverController/ActionButton";
import { cn } from "@core-ui/utils/cn";
import t from "@ext/localization/locale/translate";
import { SortState } from "@ext/markdown/elements/table/edit/model/tableTypes";
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
import { type ReactNode, useCallback, useMemo, useState } from "react";

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

	const sortedСolumnValues = useMemo(
		() => [...columnValues].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
		[columnValues],
	);

	const onResizeEnd = useCallback((event: MouseEvent) => {
		const wrapper = (event.target as HTMLDivElement)?.parentElement?.parentElement;
		if (!wrapper) return;

		const width = wrapper.clientWidth;
		const height = wrapper.clientHeight;

		setWidth(width);
		setHeight(height);
	}, []);

	const [isOpen, setIsOpen] = useState(false);
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
					<div className="grid h-full grid-rows-[auto_auto_auto_auto_minmax(10rem,1fr)]">
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
						<Command className="!shadow-none border-none">
							<SearchSelectInput placeholder={t("find2")} />
							<div className="max-h-none p-1">
								<CommandItem forceMount key="*">
									<CommandCheckboxField
										checked={checkedState}
										label={t("properties.select-all")}
										onCheckedChange={onCheckAll}
									/>
								</CommandItem>
								<CommandList key={`list-${"searchQuery"}`}>
									{sortedСolumnValues.map((value) => (
										<CommandItem key={`v-${value}`} title={value} value={value}>
											<CommandCheckboxField
												checked={!filteredValues.includes(value)}
												className={!value && "[&_label]:text-muted"}
												label={value || t("properties.empty")}
												onCheckedChange={() => onCheckedChange(value)}
											/>
										</CommandItem>
									))}
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
