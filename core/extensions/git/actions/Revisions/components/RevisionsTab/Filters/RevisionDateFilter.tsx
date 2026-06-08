import useWatch from "@core-ui/hooks/useWatch";
import { cn } from "@core-ui/utils/cn";
import type { DatePreset } from "@core-ui/utils/dateUtils";
import DateUtils from "@core-ui/utils/dateUtils";
import t from "@ext/localization/locale/translate";
import { Calendar } from "@ui-kit/Calendar";
import { Divider } from "@ui-kit/Divider";
import { Icon } from "@ui-kit/Icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { ToggleGroup, ToggleGroupItem } from "@ui-kit/ToggleGroup";
import { Fragment, useCallback, useState } from "react";
import type { DateRange } from "react-day-picker";

interface RevisionDateFilterProps {
	value: DateRange;
	onChange: (value: DateRange) => void;
}

export const RevisionDateFilter = ({ value, onChange }: RevisionDateFilterProps) => {
	const [localValue, setLocalValue] = useState<DateRange>(value);
	const activePreset = DateUtils.detectPreset(localValue);

	useWatch(() => {
		setLocalValue(value);
	}, [value]);

	const handlePreset = useCallback(
		(preset: DatePreset) => {
			const range = DateUtils.getDatePresetRange(preset);
			setLocalValue(range);
			onChange(range);
		},
		[onChange],
	);

	const handleCalendarSelect = useCallback(
		(date: DateRange) => {
			const normalized: DateRange = {
				from: date?.from ? new Date(date.from.setHours(0, 0, 0, 0)) : null,
				to: date?.to ? new Date(date.to.setHours(23, 59, 59, 999)) : null,
			};
			setLocalValue(normalized);
			if (normalized.from && normalized.to) onChange(normalized);
		},
		[onChange],
	);

	const formatDate = (date: Date) => date?.toLocaleDateString() ?? "";
	const presets = DateUtils.getDatePresets();

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between">
				<span className="text-xs font-normal uppercase text-muted tracking-wide">
					{t("git.history.filters.date.title")}
				</span>
			</div>
			<ToggleGroup
				className="gap-0 rounded-lg border border-secondary-border shadow-soft-sm"
				onValueChange={handlePreset}
				type="single"
				value={activePreset}
				variant="ghost"
			>
				{presets.map((preset, index) => (
					<Fragment key={preset}>
						<ToggleGroupItem
							className={cn(
								"text-xs font-normal whitespace-nowrap rounded-none flex-1",
								index === 0 && "rounded-none rounded-l-md",
								index === presets.length - 1 && "rounded-none rounded-r-md",
							)}
							key={preset}
							size="sm"
							value={preset}
						>
							{t(`git.history.filters.date.${preset}`)}
						</ToggleGroupItem>
						{index < presets.length - 1 && <Divider className="h-8" orientation="vertical" />}
					</Fragment>
				))}
			</ToggleGroup>
			<Popover>
				<PopoverTriggerButton asChild className="w-full font-normal pl-2 justify-between" size="sm">
					<span className="text-muted">
						<Icon className="text-muted shrink-0 inline-flex mr-2" icon="calendar" />
						{localValue?.from ? formatDate(localValue.from) : t("git.history.filters.date.placeholder")}
					</span>
					<Icon className="text-muted shrink-0" icon="move-right" />
					<span className="text-muted">
						<Icon className="text-muted shrink-0 inline-flex mr-2" icon="calendar" />
						{localValue?.to ? formatDate(localValue.to) : t("git.history.filters.date.placeholder")}
					</span>
				</PopoverTriggerButton>
				<PopoverContent className="p-0">
					<Calendar
						className="border-0 shadow-none bg-transparent"
						defaultMonth={localValue?.from ?? new Date()}
						mode="range"
						onSelect={handleCalendarSelect}
						selected={localValue}
					/>
				</PopoverContent>
			</Popover>
		</div>
	);
};
