import useWatch from "@core-ui/hooks/useWatch";
import { cn } from "@core-ui/utils/cn";
import type { DatePreset } from "@core-ui/utils/dateUtils";
import DateUtils from "@core-ui/utils/dateUtils";
import t from "@ext/localization/locale/translate";
import { Calendar } from "@ui-kit/Calendar";
import { Icon } from "@ui-kit/Icon";
import { Popover, PopoverContent, PopoverTriggerButton } from "@ui-kit/Popover";
import { ToggleGroup, ToggleGroupItem } from "@ui-kit/ToggleGroup";
import { useCallback, useState } from "react";
import type { DateRange } from "react-day-picker";

interface ReviewDateFilterProps {
	value: DateRange;
	onChange: (value: DateRange) => void;
}

export const ReviewDateFilter = ({ value, onChange }: ReviewDateFilterProps) => {
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
		<div className="space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-xs font-normal uppercase text-muted tracking-wide">
					{t("editor.modes.filters.date.title")}
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
					<ToggleGroupItem
						className={cn(
							"text-xs font-normal whitespace-nowrap rounded-none",
							index === 0 && "rounded-none rounded-l-md",
							index === presets.length - 1 && "rounded-none rounded-r-md",
						)}
						key={preset}
						size="sm"
						value={preset}
					>
						{t(`editor.modes.filters.date.presets.${preset}`)}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
			<div className="flex gap-2 items-center">
				<Popover>
					<PopoverTriggerButton asChild className="flex-1 font-normal" size="sm">
						<Icon className="text-muted shrink-0" icon="calendar" />
						{localValue?.from ? (
							<span className="text-muted">{formatDate(localValue.from)}</span>
						) : (
							<span className="text-xs text-muted mr-1">
								{t("editor.modes.filters.date.placeholder")}
							</span>
						)}
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
				<Icon className="text-muted" icon="move-right" />
				<Popover>
					<PopoverTriggerButton asChild className="flex-1 font-normal" size="sm">
						<Icon className="text-muted shrink-0" icon="calendar" />
						{localValue?.to ? (
							<span className="text-muted">{formatDate(localValue.to)}</span>
						) : (
							<span className="text-xs text-muted mr-1">
								{t("editor.modes.filters.date.placeholder")}
							</span>
						)}
					</PopoverTriggerButton>
					<PopoverContent className="p-0">
						<Calendar
							className="border-0 shadow-none bg-transparent"
							defaultMonth={localValue?.to ?? new Date()}
							mode="range"
							onSelect={handleCalendarSelect}
							selected={localValue}
						/>
					</PopoverContent>
				</Popover>
			</div>
		</div>
	);
};
